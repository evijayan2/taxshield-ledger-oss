/**
 * Provider Payroll Audit Express Router.
 * Endpoints for parsing provider CSV registers, analyzing statutory tax variances,
 * and converting verified registers into historical ledger runs.
 */
import { Router, Response } from 'express';
import { requireAuth, requireOwner, type AuthenticatedRequest } from '../auth/middleware.js';
import { prisma } from '../prisma.js';
import {
  parseProviderPayrollCsv,
  generateProviderAuditReport,
  type ProviderPayrollRow,
  type ProviderAuditReport,
  type AuditComparisonResult,
  type Employee,
} from 'taxshield-ledger-core';

export const providerAuditRouter = Router();

function validateCompanyAccess(req: AuthenticatedRequest, res: Response, targetCompanyId: string): boolean {
  if (!req.membership || req.membership.companyId !== targetCompanyId) {
    res.status(403).json({ success: false, error: 'Forbidden. Cross-company access is strictly prohibited.' });
    return false;
  }
  return true;
}

providerAuditRouter.post(
  '/companies/:id/provider-audit/parse',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.params.id;
    if (!validateCompanyAccess(req, res, companyId)) return;
    try {
      const { csvContent } = req.body;
      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(400).json({ success: false, error: 'Missing or invalid csvContent parameter.' });
      }
      const parsed = parseProviderPayrollCsv(csvContent);
      return res.json({ success: true, ...parsed, rowCount: parsed.rows.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'CSV parse error.' });
    }
  }
);

providerAuditRouter.post(
  '/companies/:id/provider-audit/analyze',
  requireAuth,
  requireOwner,
  async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.params.id;
    if (!validateCompanyAccess(req, res, companyId)) return;
    try {
      let rows: ProviderPayrollRow[] = req.body.rows;
      let provider = req.body.provider || 'GENERIC';
      if (!rows && req.body.csvContent) {
        const parsed = parseProviderPayrollCsv(req.body.csvContent);
        rows = parsed.rows;
        provider = parsed.provider;
      }
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, error: 'No payroll rows provided to analyze.' });
      }
      const employees = (await prisma.employee.findMany({ where: { companyId } })) as unknown as Employee[];
      const settings = (await prisma.companyTaxSetting.findMany({
        where: { companyId },
        include: { rateHistories: true },
      })) as any[];
      const report = generateProviderAuditReport(companyId, rows, employees, settings, provider);
      return res.json({ success: true, report });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Audit analysis error.' });
    }
  }
);

async function createHistoricalPayStub(tx: any, runId: string, comp: AuditComparisonResult) {
  const calc = comp.taxShieldCalculated;
  const gross = calc?.grossEarnings || comp.providerRow.grossWages;
  const fit = calc?.fit ?? comp.providerRow.fitWithheld;
  const ss = calc?.ss ?? comp.providerRow.ficaSsWithheld;
  const med = calc?.med ?? comp.providerRow.ficaMedWithheld;
  const sit = calc?.sit ?? comp.providerRow.stateWithheld;
  return tx.payStub.create({
    data: {
      payrollRunId: runId,
      employeeId: comp.employeeId || 'unknown_emp',
      periodStart: comp.periodStart,
      periodEnd: comp.periodEnd,
      payDate: comp.checkDate,
      hoursWorked: 40,
      overtimeHours: 0,
      hourlyRate: gross / 40,
      grossEarnings: gross,
      federalIncomeTax: fit,
      socialSecurityTax: ss,
      medicareTax: med,
      stateIncomeTax: sit,
      localIncomeTax: calc?.eit ?? comp.providerRow.localWithheld,
      totalEmployeeTaxes: fit + ss + med + sit,
      mileageReimbursement: 0,
      travelExpensesReimbursement: 0,
      totalReimbursements: 0,
      netPay: calc?.netPay ?? comp.providerRow.netPay,
      employerSocialSecurity: ss,
      employerMedicare: med,
      employerStateUnemployment: calc?.suta ?? comp.providerRow.employerSuta ?? 0,
      totalEmployerTaxes: ss + med + (calc?.suta ?? 0),
      totalCompanyCost: comp.providerRow.grossWages,
    },
  });
}

providerAuditRouter.post(
  '/companies/:id/provider-audit/convert-to-runs',
  requireAuth,
  requireOwner,
  async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.params.id;
    if (!validateCompanyAccess(req, res, companyId)) return;
    const actorId = req.user?.id || 'unknown_owner';
    try {
      const report: ProviderAuditReport = req.body.report;
      if (!report || !report.comparisons || report.comparisons.length === 0) {
        return res.status(400).json({ success: false, error: 'Valid ProviderAuditReport required.' });
      }
      const periodStart = req.body.periodStart || report.comparisons[0].periodStart;
      const periodEnd = req.body.periodEnd || report.comparisons[0].periodEnd;
      const payDate = req.body.payDate || report.comparisons[0].checkDate;

      const run = await prisma.$transaction(async (tx) => {
        const createdRun = await tx.payrollRun.create({
          data: {
            companyId,
            periodStart,
            periodEnd,
            payDate,
            status: 'LOCKED',
            totalGross: report.totalGross,
            totalEmployeeTaxes: report.totalTaxShieldTaxes,
            totalReimbursements: 0,
            totalNetPay: report.totalNet,
            totalEmployerTaxes: 0,
            totalCompanyCost: report.totalGross,
            stubsCount: report.comparisons.length,
          },
        });
        for (const comp of report.comparisons) {
          await createHistoricalPayStub(tx, createdRun.id, comp);
        }
        await tx.auditLogEntry.create({
          data: {
            companyId,
            entityType: 'PayrollRun',
            entityId: createdRun.id,
            action: 'PROVIDER_AUDIT_IMPORT',
            actorId,
            newState: {
              provider: report.provider,
              stubsCount: report.comparisons.length,
              totalGross: report.totalGross,
            },
            reason: `Imported historical payroll run from ${report.provider} register after variance verification.`,
          },
        });
        return createdRun;
      });

      return res.json({ success: true, payrollRunId: run.id, stubsCreated: report.comparisons.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Run conversion error.' });
    }
  }
);
