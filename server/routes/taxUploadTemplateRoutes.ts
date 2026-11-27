/**
 * Tax Filing Upload Template API Routes.
 * Manages per-company electronic tax upload templates (e.g., PA Keystone EIT/LST, myPATH)
 * and generates populated export files for payroll runs.
 */

import { Router, Response } from 'express';
import { requireAuth, requireOwner, type AuthenticatedRequest } from '../auth/middleware.js';
import { prisma } from '../prisma.js';
import {
  SUPPORTED_UPLOAD_PORTALS,
  parseTaxUploadTemplate,
  generateTaxUploadExport,
  decryptTIN,
  type UploadFileFormat,
} from 'taxshield-ledger-core';

export const taxUploadTemplateRouter = Router();

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
 * GET /companies/:id/upload-templates
 * Lists all configured upload templates for the company alongside supported portal metadata.
 */
taxUploadTemplateRouter.get(
  '/companies/:id/upload-templates',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const companyId = req.params.id;
    if (!validateCompanyAccess(req, res, companyId)) return;

    try {
      const templates = await prisma.taxFilingUploadTemplate.findMany({
        where: { companyId },
        orderBy: { updatedAt: 'desc' },
      });

      return res.json({
        success: true,
        templates,
        supportedPortals: SUPPORTED_UPLOAD_PORTALS,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * PUT /companies/:id/upload-templates/:portalKey
 * Creates or updates an electronic tax upload template for a portal.
 * Enforces that a template file is provided whenever the upload option is enabled.
 */
taxUploadTemplateRouter.put(
  '/companies/:id/upload-templates/:portalKey',
  requireAuth,
  requireOwner,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: companyId, portalKey } = req.params;
    if (!validateCompanyAccess(req, res, companyId)) return;

    const {
      portalLabel,
      jurisdiction,
      fileFormat,
      isEnabled = true,
      templateFileName,
      templateContent,
      businessLocationPsd,
      notes,
    } = req.body ?? {};

    if (!portalLabel || !jurisdiction) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: portalLabel and jurisdiction.',
      });
    }

    if (isEnabled && (!templateFileName || !String(templateContent ?? '').trim())) {
      return res.status(400).json({
        success: false,
        error: 'A template file must be provided when enabling an upload option.',
      });
    }

    try {
      const parsed = parseTaxUploadTemplate(
        String(templateFileName || `${portalKey}.csv`),
        String(templateContent || ''),
        fileFormat as UploadFileFormat | undefined
      );

      const template = await prisma.$transaction(async (tx) => {
        const upserted = await tx.taxFilingUploadTemplate.upsert({
          where: {
            companyId_portalKey: { companyId, portalKey },
          },
          update: {
            portalLabel: String(portalLabel).trim(),
            jurisdiction: String(jurisdiction).trim(),
            fileFormat: parsed.fileFormat,
            isEnabled: Boolean(isEnabled),
            templateFileName: String(templateFileName).trim(),
            templateContent: String(templateContent),
            templateHashSha256: parsed.templateHashSha256,
            detectedHeaders: parsed.detectedHeaders,
            businessLocationPsd: businessLocationPsd ? String(businessLocationPsd).trim() : null,
            notes: notes ? String(notes).trim() : null,
          },
          create: {
            companyId,
            portalKey,
            portalLabel: String(portalLabel).trim(),
            jurisdiction: String(jurisdiction).trim(),
            fileFormat: parsed.fileFormat,
            isEnabled: Boolean(isEnabled),
            templateFileName: String(templateFileName).trim(),
            templateContent: String(templateContent),
            templateHashSha256: parsed.templateHashSha256,
            detectedHeaders: parsed.detectedHeaders,
            businessLocationPsd: businessLocationPsd ? String(businessLocationPsd).trim() : null,
            notes: notes ? String(notes).trim() : null,
          },
        });

        await tx.auditLogEntry.create({
          data: {
            companyId,
            action: 'UPSERT_TAX_UPLOAD_TEMPLATE',
            entityType: 'TAX_FILING_UPLOAD_TEMPLATE',
            entityId: upserted.id,
            actorId: req.user!.id,
            newState: {
              portalKey,
              portalLabel: upserted.portalLabel,
              fileFormat: upserted.fileFormat,
              isEnabled: upserted.isEnabled,
              templateFileName: upserted.templateFileName,
              templateHashSha256: upserted.templateHashSha256,
              businessLocationPsd: upserted.businessLocationPsd,
            },
            reason: `Configured ${upserted.portalLabel} upload template (${upserted.templateFileName})`,
          },
        });

        return upserted;
      });

      return res.status(200).json({
        success: true,
        template,
        warnings: parsed.warnings,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);

/**
 * DELETE /companies/:id/upload-templates/:portalKey
 * Removes a configured upload template and records an immutable audit log entry.
 */
taxUploadTemplateRouter.delete(
  '/companies/:id/upload-templates/:portalKey',
  requireAuth,
  requireOwner,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: companyId, portalKey } = req.params;
    if (!validateCompanyAccess(req, res, companyId)) return;

    try {
      const existing = await prisma.taxFilingUploadTemplate.findUnique({
        where: { companyId_portalKey: { companyId, portalKey } },
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Upload template not found.' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.taxFilingUploadTemplate.delete({
          where: { companyId_portalKey: { companyId, portalKey } },
        });

        await tx.auditLogEntry.create({
          data: {
            companyId,
            action: 'DELETE_TAX_UPLOAD_TEMPLATE',
            entityType: 'TAX_FILING_UPLOAD_TEMPLATE',
            entityId: existing.id,
            actorId: req.user!.id,
            previousState: {
              portalKey: existing.portalKey,
              templateFileName: existing.templateFileName,
              templateHashSha256: existing.templateHashSha256,
            },
            reason: `Removed ${existing.portalLabel} upload template`,
          },
        });
      });

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

/**
 * POST /companies/:id/payroll-runs/:runId/upload-export/:portalKey
 * Generates a populated tax upload file for a specific payroll run using the stored template.
 */
taxUploadTemplateRouter.post(
  '/companies/:id/payroll-runs/:runId/upload-export/:portalKey',
  requireAuth,
  requireOwner,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: companyId, runId, portalKey } = req.params;
    if (!validateCompanyAccess(req, res, companyId)) return;

    try {
      const [company, template, payrollRun, employees] = await Promise.all([
        prisma.company.findUnique({ where: { id: companyId } }),
        prisma.taxFilingUploadTemplate.findUnique({
          where: { companyId_portalKey: { companyId, portalKey } },
        }),
        prisma.payrollRun.findFirst({
          where: { id: runId, companyId },
          include: { payStubs: true },
        }),
        prisma.employee.findMany({
          where: { companyId },
          include: {
            residenceHistory: {
              orderBy: { effectiveDate: 'desc' },
            },
          },
        }),
      ]);

      if (!company) {
        return res.status(404).json({ success: false, error: 'Company not found.' });
      }
      if (!template) {
        return res.status(404).json({ success: false, error: 'Upload template not configured for this portal.' });
      }

      const fallbackRun = req.body?.payrollRun;
      const fallbackStubs = Array.isArray(req.body?.payStubs) ? req.body.payStubs : null;
      const fallbackEmployees = Array.isArray(req.body?.employees) ? req.body.employees : [];

      if (!payrollRun && (!fallbackRun || fallbackRun.id !== runId)) {
        return res.status(404).json({ success: false, error: 'Payroll run not found.' });
      }

      const toIsoDate = (val: Date | string): string =>
        (val instanceof Date ? val.toISOString() : String(val || '')).slice(0, 10);

      const resolvedRun = payrollRun
        ? {
            id: payrollRun.id,
            periodStart: toIsoDate(payrollRun.periodStart as Date | string),
            periodEnd: toIsoDate(payrollRun.periodEnd as Date | string),
            payDate: toIsoDate(payrollRun.payDate as Date | string),
          }
        : {
            id: String(fallbackRun.id),
            periodStart: String(fallbackRun.periodStart || ''),
            periodEnd: String(fallbackRun.periodEnd || ''),
            payDate: String(fallbackRun.payDate || fallbackRun.periodEnd || ''),
          };

      const resolvedStubs = payrollRun?.payStubs?.length
        ? payrollRun.payStubs
        : (fallbackStubs ?? []);

      const rawEmployees = employees.length > 0 ? employees : fallbackEmployees;
      const resolvedEmployees = rawEmployees.map((emp: any) => {
        let ssn = emp?.ssn;
        if (!ssn && emp?.ssnEncrypted) {
          try {
            ssn = decryptTIN(emp.ssnEncrypted);
          } catch {
            // Fall back to ssnLastFour if decryption key is unavailable or payload is invalid
          }
        }
        return { ...emp, ...(ssn ? { ssn } : {}) };
      });

      const exported = generateTaxUploadExport({
        template: {
          ...template,
          businessLocationPsd: template.businessLocationPsd ?? undefined,
          notes: template.notes ?? undefined,
          updatedAt:
            template.updatedAt instanceof Date
              ? template.updatedAt.toISOString()
              : String(template.updatedAt ?? ''),
          detectedHeaders: Array.isArray(template.detectedHeaders)
            ? (template.detectedHeaders as string[])
            : [],
        },
        company,
        payrollRun: resolvedRun,
        payStubs: resolvedStubs as any,
        employees: resolvedEmployees as any,
      });

      return res.json({ success: true, ...exported });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
);
