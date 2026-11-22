/**
 * SUTA Experience Rating API Routes.
 * Exposes endpoints for managing company SUTA experience ratings and DOL notice tracking.
 */

import { Router, Response } from 'express';
import { requireAuth, requireOwner, type AuthenticatedRequest } from '../auth/middleware.js';
import { prisma } from '../prisma.js';
import {
  getStatutorySutaRule,
  validateSutaRateBounds,
  decimalToBps,
  formatRatePercent,
} from 'taxshield-ledger-core';

export const sutaRouter = Router();

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
 * GET /companies/:id/suta-rates
 * Returns all SUTA tax settings and historical experience rates for the company.
 */
sutaRouter.get('/companies/:id/suta-rates', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.id;
  if (!validateCompanyAccess(req, res, companyId)) return;

  try {
    const settings = await prisma.companyTaxSetting.findMany({
      where: { companyId, taxKind: 'SUTA' },
      include: {
        rateHistories: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    return res.json({ success: true, settings });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /companies/:id/suta-rates
 * Creates or updates a company SUTA experience rate and records an audit log entry.
 */
sutaRouter.post('/companies/:id/suta-rates', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.id;
  if (!validateCompanyAccess(req, res, companyId)) return;

  const {
    jurisdiction,
    stateAccountId,
    rateDecimal,
    effectiveFrom,
    effectiveTo,
    noticeReference,
    wageBaseOverride,
  } = req.body;

  if (!jurisdiction || typeof rateDecimal !== 'number' || !effectiveFrom) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: jurisdiction, rateDecimal, effectiveFrom.',
    });
  }

  const normState = String(jurisdiction).trim().toUpperCase();
  const fromDate = new Date(effectiveFrom);
  const toDate = effectiveTo ? new Date(effectiveTo) : null;

  try {
    const statutoryRule = getStatutorySutaRule(normState, fromDate);
    const validation = validateSutaRateBounds(rateDecimal, statutoryRule);

    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const result = await prisma.$transaction(async (tx) => {
      let setting = await tx.companyTaxSetting.findUnique({
        where: {
          companyId_jurisdiction_taxKind: {
            companyId,
            jurisdiction: normState,
            taxKind: 'SUTA',
          },
        },
      });

      if (!setting) {
        setting = await tx.companyTaxSetting.create({
          data: {
            companyId,
            jurisdiction: normState,
            taxKind: 'SUTA',
            stateAccountId: stateAccountId || null,
            status: 'ACTIVE',
          },
        });
      } else if (stateAccountId && setting.stateAccountId !== stateAccountId) {
        setting = await tx.companyTaxSetting.update({
          where: { id: setting.id },
          data: { stateAccountId },
        });
      }

      // Mark prior active overlapping rates as SUPERSEDED
      await tx.experienceRateHistory.updateMany({
        where: {
          companyTaxSettingId: setting.id,
          status: 'ACTIVE',
          effectiveFrom: { lte: fromDate },
        },
        data: {
          status: 'SUPERSEDED',
          effectiveTo: fromDate,
        },
      });

      const rateBps = decimalToBps(rateDecimal);
      const history = await tx.experienceRateHistory.create({
        data: {
          companyId,
          companyTaxSettingId: setting.id,
          rateDecimal,
          rateBps,
          wageBaseOverride: wageBaseOverride ? Number(wageBaseOverride) : null,
          effectiveFrom: fromDate,
          effectiveTo: toDate,
          noticeReference: noticeReference || null,
          status: 'ACTIVE',
          verifiedBy: req.user!.id,
          verifiedAt: new Date(),
        },
      });

      // Write immutable audit log
      await tx.auditLogEntry.create({
        data: {
          companyId,
          action: 'UPDATE_SUTA_RATE',
          entityType: 'COMPANY_TAX_SETTING',
          entityId: setting.id,
          actorId: req.user!.id,
          newState: {
            jurisdiction: normState,
            rateDecimal,
            ratePercent: formatRatePercent(rateDecimal),
            rateBps,
            noticeReference: noticeReference || null,
            effectiveFrom: effectiveFrom,
          },
          reason: `Updated SUTA experience rate to ${formatRatePercent(rateDecimal)} for ${normState}`,
        },
      });

      return { setting, history };
    });

    return res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
