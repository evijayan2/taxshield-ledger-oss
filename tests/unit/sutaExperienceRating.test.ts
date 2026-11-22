import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../server/prisma.js';
import {
  getStatutorySutaRule,
  validateSutaRateBounds,
  resolveSutaRate,
  createSutaAuditEntry,
  calculateGrossToNet,
  type CompanyTaxSetting,
  type Employee,
} from 'taxshield-ledger-core';

describe('SUTA Experience Rating & DOR Validation (Story 3)', () => {
  const timestamp = Date.now();
  let companyId: string;
  let taxYearId: string;
  let employeeId: string;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: {
        name: `SUTA Test LLC ${timestamp}`,
        ein: '11-2233445',
        stateTaxId: '88776655',
        address: '400 Market St',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19106',
        ownerName: 'Alice Auditor',
        ownerEmail: `alice_${timestamp}@suta.tax`,
      },
    });
    companyId = company.id;

    const taxYear = await prisma.taxYear.create({
      data: {
        companyId,
        year: 2026,
        status: 'ACTIVE',
      },
    });
    taxYearId = taxYear.id;

    const employee = await prisma.employee.create({
      data: {
        companyId,
        firstName: 'Bob',
        lastName: 'Worker',
        email: `bob_${timestamp}@suta.tax`,
        phone: '215-555-0188',
        ssnLastFour: '4321',
        employmentType: 'FULL_TIME',
        payRate: 30.0,
        payFrequency: 'BI_WEEKLY',
        w4FilingStatus: 'SINGLE',
      },
    });
    employeeId = employee.id;
  });

  afterAll(async () => {
    if (companyId) {
      await prisma.company.delete({
        where: { id: companyId },
      }).catch(() => undefined);
    }
  });

  describe('Statutory Bounds & Validation', () => {
    it('retrieves statutory bounds from active PA tax rule version', () => {
      const rule = getStatutorySutaRule('PA');
      expect(rule.ruleCode).toBe('PA_UC_EMPLOYER');
      expect(rule.rate).toBe(0.035);
      expect(rule.wageCap).toBe(10000);
      expect(rule.ceilingRate).toBeGreaterThan(0.035);
    });

    it('rejects an experience rate exceeding the statutory ceiling', () => {
      const rule = getStatutorySutaRule('PA');
      const check = validateSutaRateBounds(0.25, rule);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('exceeds state statutory ceiling');
    });

    it('rejects a negative SUTA rate', () => {
      const check = validateSutaRateBounds(-0.0125);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('cannot be negative');
    });

    it('accepts an assigned rate within statutory limits', () => {
      const rule = getStatutorySutaRule('PA');
      const check = validateSutaRateBounds(0.04125, rule);
      expect(check.valid).toBe(true);
      expect(check.error).toBeUndefined();
    });
  });

  describe('Database Models & Relations', () => {
    let settingId: string;
    let initialHistoryId: string;

    it('persists CompanyTaxSetting with company scoping', async () => {
      const setting = await prisma.companyTaxSetting.create({
        data: {
          companyId,
          jurisdiction: 'PA',
          taxKind: 'SUTA',
          stateAccountId: 'PA-UC-1234567',
          status: 'ACTIVE',
        },
      });

      expect(setting.id).toBeDefined();
      expect(setting.companyId).toBe(companyId);
      expect(setting.jurisdiction).toBe('PA');
      expect(setting.stateAccountId).toBe('PA-UC-1234567');
      settingId = setting.id;
    });

    it('persists ExperienceRateHistory linked to setting and records audit trail', async () => {
      const history = await prisma.experienceRateHistory.create({
        data: {
          companyId,
          companyTaxSettingId: settingId,
          taxYearId,
          rateDecimal: 0.04125,
          rateBps: 413,
          effectiveFrom: new Date('2026-01-01'),
          noticeReference: 'PA Form UC-657 (2026)',
          status: 'ACTIVE',
          verifiedBy: 'usr-admin-01',
          verifiedAt: new Date(),
        },
      });

      expect(history.id).toBeDefined();
      expect(Number(history.rateDecimal)).toBe(0.04125);
      expect(history.rateBps).toBe(413);
      expect(history.noticeReference).toBe('PA Form UC-657 (2026)');
      initialHistoryId = history.id;

      // Audit log entry
      const auditEntry = createSutaAuditEntry({
        companyId,
        actorId: 'usr-admin-01',
        stateCode: 'PA',
        newRate: 0.04125,
        noticeReference: 'PA Form UC-657 (2026)',
        effectiveFrom: '2026-01-01',
      });

      const auditLog = await prisma.auditLogEntry.create({
        data: {
          companyId: auditEntry.companyId,
          actorId: auditEntry.actorId,
          action: auditEntry.action,
          entityType: 'COMPANY_TAX_SETTING',
          entityId: settingId,
          newState: auditEntry.details,
          reason: 'Initial 2026 SUTA rate verification',
        },
      });

      expect(auditLog.id).toBeDefined();
      expect(auditLog.action).toBe('UPDATE_SUTA_RATE');
    });

    it('handles mid-year rate revision by superseding prior history', async () => {
      // Supersede prior history
      await prisma.experienceRateHistory.update({
        where: { id: initialHistoryId },
        data: {
          status: 'SUPERSEDED',
          effectiveTo: new Date('2026-06-30'),
        },
      });

      // Create new mid-year rate
      const revisedHistory = await prisma.experienceRateHistory.create({
        data: {
          companyId,
          companyTaxSettingId: settingId,
          taxYearId,
          rateDecimal: 0.0435,
          rateBps: 435,
          effectiveFrom: new Date('2026-07-01'),
          noticeReference: 'PA Form UC-657 Revised Mid-Year',
          status: 'ACTIVE',
          verifiedBy: 'usr-admin-01',
          verifiedAt: new Date(),
        },
      });

      expect(revisedHistory.status).toBe('ACTIVE');
      expect(Number(revisedHistory.rateDecimal)).toBe(0.0435);

      const oldHist = await prisma.experienceRateHistory.findUnique({
        where: { id: initialHistoryId },
      });
      expect(oldHist?.status).toBe('SUPERSEDED');
      expect(oldHist?.effectiveTo).toBeDefined();
    });
  });

  describe('Payroll Gross-to-Net Resolution with Assigned Experience Rate', () => {
    const testEmployee: Employee = {
      id: 'emp-suta-test',
      firstName: 'Bob',
      lastName: 'Worker',
      email: 'bob@suta.tax',
      phone: '215-555-0188',
      ssnLastFour: '4321',
      employmentType: 'W2_HOURLY',
      payRate: 25.0, // $2,000 for 80 hours
      payFrequency: 'BI_WEEKLY',
      w4FilingStatus: 'SINGLE',
      w4MultipleJobs: false,
      w4DependentCredit: 0,
      w4OtherIncome: 0,
      w4Deductions: 0,
      w4ExtraWithholding: 0,
      workState: 'PA',
      state: 'PA',
      isActive: true,
    };

    it('calculates employer SUTA with company assigned rate of 4.125%', () => {
      const mockSettings: CompanyTaxSetting[] = [
        {
          id: 'sett-pa',
          companyId,
          jurisdiction: 'PA',
          taxKind: 'SUTA',
          stateAccountId: 'PA-UC-1234567',
          status: 'ACTIVE',
          rateHistories: [
            {
              id: 'hist-active',
              companyId,
              companyTaxSettingId: 'sett-pa',
              rateDecimal: 0.04125,
              rateBps: 413,
              effectiveFrom: '2026-01-01',
              effectiveTo: null,
              noticeReference: 'PA Form UC-657 (2026)',
              status: 'ACTIVE',
            },
          ],
        },
      ];

      const res = calculateGrossToNet(
        testEmployee,
        80,
        0,
        0,
        0,
        [],
        '2026-03-01',
        '2026-03-15',
        [],
        new Date('2026-03-15'),
        [],
        mockSettings
      );

      expect(res.grossEarnings).toBe(2000);
      expect(res.sutaResolution.source).toBe('ASSIGNED_EXPERIENCE_RATE');
      expect(res.sutaResolution.rate).toBe(0.04125);
      // 2000 * 0.04125 = 82.50
      expect(res.employerStateUnemployment).toBe(82.5);
      expect(res.taxBreakdown.suta.rate).toBe(0.04125);
      expect(res.taxBreakdown.suta.noticeReference).toBe('PA Form UC-657 (2026)');
    });

    it('falls back to statutory standard rate when no assigned experience rate is configured', () => {
      const res = calculateGrossToNet(
        testEmployee,
        80,
        0,
        0,
        0,
        [],
        '2026-03-01',
        '2026-03-15',
        [],
        new Date('2026-03-15')
      );

      expect(res.grossEarnings).toBe(2000);
      expect(res.sutaResolution.source).toBe('STATUTORY_DEFAULT');
      expect(res.sutaResolution.rate).toBe(0.035);
      // 2000 * 0.035 = 70.00
      expect(res.employerStateUnemployment).toBe(70);
    });
  });
});
