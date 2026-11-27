/**
 * Payroll Tax Liability API Routes.
 * Exposes endpoints to query, generate, and record settlement of discrete tax liabilities.
 */

import { Router, Response } from 'express';
import { requireAuth, requireOwner, type AuthenticatedRequest } from '../auth/middleware.js';
import { prisma } from '../prisma.js';
import {
  decomposePayStubsToLiabilities,
  buildFederal941Bundle,
  buildStateRemittanceSummaries,
  parseDateParts,
  PayStub,
  PayrollTaxLiability,
} from 'taxshield-ledger-core';

export const payrollLiabilityRouter = Router();

/**
 * Validates company access for the current session.
 */
function validateCompanyAccess(req: AuthenticatedRequest, res: Response, targetCompanyId: string): boolean {
  if (!req.membership || req.membership.companyId !== targetCompanyId) {
    res.status(403).json({ success: false, error: 'Forbidden. Cross-company access prohibited.' });
    return false;
  }
  return true;
}

/**
 * Formats a Date object to YYYY-MM-DD.
 */
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Maps database liability records into API presentation objects.
 */
function mapDbLiability(l: any): PayrollTaxLiability {
  return {
    id: l.id,
    companyId: l.companyId,
    payrollRunId: l.payrollRunId,
    taxYearId: l.taxYearId,
    jurisdictionId: l.jurisdictionId,
    agencyCode: l.agencyCode,
    taxType: l.taxType,
    amount: Number(l.amount),
    liabilityPeriodEnd: toDateStr(l.liabilityPeriodEnd),
    statutoryDueDate: toDateStr(l.statutoryDueDate),
    status: l.status,
    confirmationNumber: l.confirmationNumber,
    paidAt: l.paidAt ? l.paidAt.toISOString() : null,
    notes: l.notes,
  };
}

/**
 * Finds matching tax year by payroll run pay date.
 */
async function resolveTaxYearId(companyId: string, payDate: string): Promise<string | null> {
  const { year } = parseDateParts(payDate);
  const matched = await prisma.taxYear.findFirst({ where: { companyId, year } });
  if (matched) return matched.id;
  const active = await prisma.taxYear.findFirst({ where: { companyId, status: 'ACTIVE' } });
  return active?.id || (await prisma.taxYear.findFirst({ where: { companyId } }))?.id || null;
}

/**
 * Saves generated liabilities without overwriting already settled items.
 */
async function persistGeneratedLiabilities(
  companyId: string,
  runId: string,
  taxYearId: string,
  actorId: string,
  items: PayrollTaxLiability[]
) {
  return prisma.$transaction(async (tx) => {
    for (const item of items) {
      const existing = await tx.payrollTaxLiability.findUnique({ where: { id: item.id } });
      if (existing && existing.status === 'SETTLED') continue;

      await tx.payrollTaxLiability.upsert({
        where: { id: item.id },
        update: {
          amount: item.amount,
          statutoryDueDate: new Date(item.statutoryDueDate),
          liabilityPeriodEnd: new Date(item.liabilityPeriodEnd),
        },
        create: {
          id: item.id,
          companyId,
          payrollRunId: runId,
          taxYearId,
          agencyCode: item.agencyCode,
          taxType: item.taxType,
          amount: item.amount,
          liabilityPeriodEnd: new Date(item.liabilityPeriodEnd),
          statutoryDueDate: new Date(item.statutoryDueDate),
          status: 'UNPAID',
        },
      });
    }

    await tx.auditLogEntry.create({
      data: {
        companyId,
        entityType: 'PAYROLL_TAX_LIABILITIES',
        entityId: runId,
        action: 'GENERATE_LIABILITIES',
        actorId,
        newState: { runId, count: items.length, total: items.reduce((s, l) => s + l.amount, 0) },
        reason: `Generated ${items.length} discrete tax liabilities for payroll run ${runId}`,
      },
    });
  });
}

/**
 * GET /companies/:id/payroll-runs/:runId/liabilities
 * Owner-only endpoint returning discrete liabilities and payment bundles.
 */
payrollLiabilityRouter.get(
  '/companies/:id/payroll-runs/:runId/liabilities',
  requireAuth,
  requireOwner,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: companyId, runId } = req.params;
    if (!validateCompanyAccess(req, res, companyId)) return;

    try {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

      const payrollRun = await prisma.payrollRun.findFirst({
        where: { id: runId, companyId },
        include: { payStubs: true, taxLiabilities: { include: { allocations: true } } },
      });
      if (!payrollRun) return res.status(404).json({ success: false, error: 'Payroll run not found' });

      let liabilities: PayrollTaxLiability[] = (payrollRun.taxLiabilities || []).map(mapDbLiability);

      // Auto-decompose and persist if not yet stored
      if (liabilities.length === 0 && payrollRun.payStubs.length > 0) {
        const taxYearId = await resolveTaxYearId(companyId, payrollRun.payDate);
        liabilities = decomposePayStubsToLiabilities({
          companyId,
          payrollRunId: runId,
          taxYearId: taxYearId || undefined,
          payDate: payrollRun.payDate,
          periodEnd: payrollRun.periodEnd,
          companyState: company.state,
          payStubs: payrollRun.payStubs as unknown as PayStub[],
        });
        if (taxYearId) {
          const actorId = req.user?.id || 'system';
          await persistGeneratedLiabilities(companyId, runId, taxYearId, actorId, liabilities);
        }
      }

      const federalBundle = buildFederal941Bundle(liabilities, company.ein, payrollRun.periodEnd);
      const stateRemittances = buildStateRemittanceSummaries(liabilities, { stateTaxId: company.stateTaxId });

      return res.json({ success: true, liabilities, federalBundle, stateRemittances });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * POST /companies/:id/payroll-runs/:runId/generate-liabilities
 * Explicitly triggers liability decomposition and persistence.
 */
payrollLiabilityRouter.post(
  '/companies/:id/payroll-runs/:runId/generate-liabilities',
  requireAuth,
  requireOwner,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: companyId, runId } = req.params;
    if (!validateCompanyAccess(req, res, companyId)) return;

    try {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

      const payrollRun = await prisma.payrollRun.findFirst({
        where: { id: runId, companyId },
        include: { payStubs: true },
      });
      if (!payrollRun) return res.status(404).json({ success: false, error: 'Payroll run not found' });

      const taxYearId = await resolveTaxYearId(companyId, payrollRun.payDate);
      if (!taxYearId) return res.status(400).json({ success: false, error: 'No matching TaxYear configured' });

      const generated = decomposePayStubsToLiabilities({
        companyId,
        payrollRunId: runId,
        taxYearId,
        payDate: payrollRun.payDate,
        periodEnd: payrollRun.periodEnd,
        companyState: company.state,
        payStubs: payrollRun.payStubs as unknown as PayStub[],
      });

      const actorId = req.user?.id || 'system';
      await persistGeneratedLiabilities(companyId, runId, taxYearId, actorId, generated);

      return res.json({ success: true, count: generated.length, liabilities: generated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * POST /companies/:id/tax-liabilities/:liabilityId/settle
 * Settles a single liability and creates payment allocation record.
 */
payrollLiabilityRouter.post(
  '/companies/:id/tax-liabilities/:liabilityId/settle',
  requireAuth,
  requireOwner,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: companyId, liabilityId } = req.params;
    if (!validateCompanyAccess(req, res, companyId)) return;

    const { confirmationNumber, paidAt, notes } = req.body;
    if (!confirmationNumber) {
      return res.status(400).json({ success: false, error: 'Confirmation number is required to settle liability.' });
    }

    try {
      const settlementDate = paidAt ? new Date(paidAt) : new Date();
      const actorId = req.user?.id || 'system';

      const updated = await prisma.$transaction(async (tx) => {
        const item = await tx.payrollTaxLiability.findFirst({ where: { id: liabilityId, companyId } });
        if (!item) throw new Error('NOT_FOUND');
        if (item.status === 'SETTLED') throw new Error('ALREADY_SETTLED');

        const saved = await tx.payrollTaxLiability.update({
          where: { id: liabilityId },
          data: { status: 'SETTLED', confirmationNumber, paidAt: settlementDate, notes: notes || item.notes },
        });

        await tx.taxPaymentAllocation.create({
          data: { companyId, liabilityId, amount: item.amount, allocatedAt: settlementDate },
        });

        await tx.auditLogEntry.create({
          data: {
            companyId,
            entityType: 'PAYROLL_TAX_LIABILITY',
            entityId: liabilityId,
            action: 'SETTLE_TAX_LIABILITY',
            actorId,
            previousState: { status: item.status },
            newState: { status: 'SETTLED', confirmationNumber, paidAt: settlementDate.toISOString() },
            reason: `Settled tax liability ${item.taxType} with confirmation ${confirmationNumber}`,
          },
        });

        return saved;
      });

      return res.json({ success: true, liability: updated });
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Liability not found' });
      if (err.message === 'ALREADY_SETTLED') return res.status(400).json({ success: false, error: 'Liability is already settled.' });
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * Validates bundle items before execution.
 */
function checkBundleItems(items: any[], requestedCount: number): string | null {
  if (items.length !== requestedCount) return 'One or more liabilities not found.';
  const settled = items.find((i) => i.status === 'SETTLED');
  if (settled) return `Liability ${settled.taxType} (${settled.id}) is already settled.`;
  return null;
}

/**
 * POST /companies/:id/tax-liabilities/settle-bundle
 * Atomically settles a bundle of liabilities (e.g. Federal 941 bundle).
 */
payrollLiabilityRouter.post(
  '/companies/:id/tax-liabilities/settle-bundle',
  requireAuth,
  requireOwner,
  async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.params.id;
    if (!validateCompanyAccess(req, res, companyId)) return;

    const { liabilityIds, confirmationNumber, paidAt, notes } = req.body;
    if (!Array.isArray(liabilityIds) || liabilityIds.length === 0 || !confirmationNumber) {
      return res.status(400).json({ success: false, error: 'liabilityIds array and confirmationNumber are required.' });
    }

    try {
      const settlementDate = paidAt ? new Date(paidAt) : new Date();
      const actorId = req.user?.id || 'system';

      await prisma.$transaction(async (tx) => {
        const items = await tx.payrollTaxLiability.findMany({ where: { id: { in: liabilityIds }, companyId } });
        const err = checkBundleItems(items, liabilityIds.length);
        if (err) throw new Error(err);

        for (const item of items) {
          await tx.payrollTaxLiability.update({
            where: { id: item.id },
            data: { status: 'SETTLED', confirmationNumber, paidAt: settlementDate, notes: notes || item.notes },
          });

          await tx.taxPaymentAllocation.create({
            data: { companyId, liabilityId: item.id, amount: item.amount, allocatedAt: settlementDate },
          });
        }

        await tx.auditLogEntry.create({
          data: {
            companyId,
            entityType: 'PAYROLL_TAX_LIABILITY_BUNDLE',
            entityId: liabilityIds.join(','),
            action: 'SETTLE_TAX_LIABILITY_BUNDLE',
            actorId,
            newState: { liabilityIds, confirmationNumber, count: items.length, paidAt: settlementDate.toISOString() },
            reason: `Settled ${items.length} liabilities in bundle with confirmation ${confirmationNumber}`,
          },
        });
      });

      return res.json({ success: true, settledCount: liabilityIds.length, confirmationNumber });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);
