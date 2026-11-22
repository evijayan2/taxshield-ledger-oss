/**
 * NACHA Direct Deposit API Routes.
 * Exposes endpoints for generating, listing, and downloading NACHA PPD batches for payroll runs.
 */

import { Router, Response } from 'express';
import { requireAuth, requireOwner, type AuthenticatedRequest } from '../auth/middleware.js';
import { prisma } from '../prisma.js';
import {
  generatePayrollNachaBatch,
  encryptString,
  decryptString,
  Company,
  PayStub,
  Employee,
} from 'taxshield-ledger-core';

export const nachaRouter = Router();

/**
 * Validates company access for the current session.
 */
function validateCompanyAccess(req: AuthenticatedRequest, res: Response, targetCompanyId: string): boolean {
  if (!req.membership || req.membership.companyId !== targetCompanyId) {
    res.status(403).json({
      success: false,
      error: 'Forbidden. Cross-company access is strictly prohibited.',
    });
    return false;
  }
  return true;
}

/**
 * Formats a Date object to YYYY-MM-DD string.
 */
function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * GET /companies/:id/ach-batches
 * Returns list of ACH batches generated for the company.
 */
nachaRouter.get('/companies/:id/ach-batches', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.id;
  if (!validateCompanyAccess(req, res, companyId)) return;

  try {
    const batches = await prisma.achBatch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyId: true,
        payrollRunId: true,
        batchType: true,
        effectiveEntryDate: true,
        entryCount: true,
        totalAmount: true,
        fileHashSha256: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json({ success: true, batches });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /companies/:id/ach-batches/:batchId/download
 * Decrypts and streams the raw 94-character fixed-width NACHA file for bank upload.
 */
nachaRouter.get('/companies/:id/ach-batches/:batchId/download', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  const { id: companyId, batchId } = req.params;
  if (!validateCompanyAccess(req, res, companyId)) return;

  try {
    const batch = await prisma.achBatch.findFirst({
      where: { id: batchId, companyId },
    });

    if (!batch) {
      return res.status(404).json({ success: false, error: 'ACH Batch not found' });
    }

    const decryptedFile = decryptString(batch.fileContentEncrypted);
    const dateStr = toDateString(batch.effectiveEntryDate);
    const filename = `nacha-ppd-${batch.id.slice(0, 8)}-${dateStr}.ach`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(decryptedFile);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Inserts AchBatch record and updates paystubs with trace numbers.
 */
async function recordAchBatchAndStubs(
  tx: any,
  companyId: string,
  runId: string,
  effectiveEntryDate: string,
  encryptedFile: string,
  result: ReturnType<typeof generatePayrollNachaBatch>
) {
  const batch = await tx.achBatch.create({
    data: {
      companyId,
      payrollRunId: runId,
      batchType: 'PPD',
      effectiveEntryDate: new Date(effectiveEntryDate),
      entryCount: result.entryCount,
      totalAmount: result.totalCreditCents / 100,
      fileContentEncrypted: encryptedFile,
      fileHashSha256: result.fileHashSha256,
      status: 'GENERATED',
    },
  });

  for (const item of result.updatedPayStubs) {
    await tx.payStub.update({
      where: { id: item.payStubId },
      data: {
        achTraceRef: item.achTraceRef,
        disbursementStatus: 'PAID',
        paidAt: new Date().toISOString(),
      },
    });
  }
  return batch;
}

/**
 * Creates an immutable AuditLogEntry for NACHA batch generation.
 */
async function recordAchBatchAuditEntry(
  tx: any,
  companyId: string,
  batchId: string,
  runId: string,
  actorId: string,
  effectiveEntryDate: string,
  result: ReturnType<typeof generatePayrollNachaBatch>
) {
  return tx.auditLogEntry.create({
    data: {
      companyId,
      entityType: 'ACH_BATCH',
      entityId: batchId,
      action: 'GENERATE_NACHA_BATCH',
      actorId,
      newState: {
        batchId,
        payrollRunId: runId,
        entryCount: result.entryCount,
        totalAmount: result.totalCreditCents / 100,
        fileHashSha256: result.fileHashSha256,
        effectiveEntryDate,
      },
      reason: `Direct Deposit NACHA PPD batch generated for payroll run ${runId}`,
      timestamp: new Date(),
    },
  });
}

/**
 * Transactionally persists generated NACHA batch, updates paystubs, and logs audit trail.
 */
async function persistNachaBatchTransaction(
  companyId: string,
  runId: string,
  effectiveEntryDate: string,
  actorId: string,
  nachaResult: ReturnType<typeof generatePayrollNachaBatch>
) {
  const encryptedFile = encryptString(nachaResult.fileContent);

  return prisma.$transaction(async (tx) => {
    const batch = await recordAchBatchAndStubs(tx, companyId, runId, effectiveEntryDate, encryptedFile, nachaResult);
    await recordAchBatchAuditEntry(tx, companyId, batch.id, runId, actorId, effectiveEntryDate, nachaResult);
    return batch;
  });
}

/**
 * POST /companies/:id/payroll-runs/:runId/nacha-batch
 * Generates NACHA direct deposit file for a payroll run, records AchBatch in DB, and assigns trace refs.
 */
nachaRouter.post('/companies/:id/payroll-runs/:runId/nacha-batch', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  const { id: companyId, runId } = req.params;
  if (!validateCompanyAccess(req, res, companyId)) return;

  const { effectiveEntryDate, companyEntryDescription } = req.body;
  if (!effectiveEntryDate) {
    return res.status(400).json({ success: false, error: 'Missing required field: effectiveEntryDate.' });
  }

  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

    const payrollRun = await prisma.payrollRun.findFirst({
      where: { id: runId, companyId },
      include: { payStubs: true },
    });
    if (!payrollRun) return res.status(404).json({ success: false, error: 'Payroll run not found' });

    const employees = await prisma.employee.findMany({
      where: { companyId },
      include: { bankHistory: true },
    });

    const nachaResult = generatePayrollNachaBatch(
      company as unknown as Company,
      payrollRun.payStubs as unknown as PayStub[],
      employees as unknown as Employee[],
      {
        effectiveEntryDate,
        companyEntryDescription: companyEntryDescription || 'PAYROLL',
      }
    );

    const actorId = req.user?.id || 'system';
    const batch = await persistNachaBatchTransaction(companyId, runId, effectiveEntryDate, actorId, nachaResult);

    return res.json({
      success: true,
      batch: {
        id: batch.id,
        payrollRunId: runId,
        entryCount: nachaResult.entryCount,
        totalAmount: nachaResult.totalCreditCents / 100,
        fileHashSha256: nachaResult.fileHashSha256,
        effectiveEntryDate,
      },
      fileContent: nachaResult.fileContent,
      lineCount: nachaResult.lineCount,
      updatedPayStubs: nachaResult.updatedPayStubs,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
