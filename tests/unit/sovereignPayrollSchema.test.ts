import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../server/prisma.js';

describe('Sovereign Payroll Schema & Relations (Story 1)', () => {
  const timestamp = Date.now();
  let companyId: string;
  let employeeId: string;
  let taxYearId: string;

  beforeAll(async () => {
    // Scaffold test company
    const company = await prisma.company.create({
      data: {
        name: `Sovereign Test LLC ${timestamp}`,
        ein: '99-8877665',
        stateTaxId: '12345678',
        address: '123 Market St',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19106',
        ownerName: 'Jane Ledger',
        ownerEmail: `jane_${timestamp}@sovereign.tax`,
      },
    });
    companyId = company.id;

    // Scaffold tax year
    const taxYear = await prisma.taxYear.create({
      data: {
        companyId,
        year: 2026,
        status: 'ACTIVE',
      },
    });
    taxYearId = taxYear.id;

    // Scaffold employee
    const employee = await prisma.employee.create({
      data: {
        companyId,
        firstName: 'John',
        lastName: 'Doe',
        email: `john_${timestamp}@sovereign.tax`,
        phone: '215-555-0199',
        ssnLastFour: '1234',
        employmentType: 'FULL_TIME',
        payRate: 35.0,
        payFrequency: 'BI_WEEKLY',
        w4FilingStatus: 'SINGLE',
      },
    });
    employeeId = employee.id;
  });

  afterAll(async () => {
    // Cascade cleanup by removing test company
    if (companyId) {
      await prisma.company.delete({
        where: { id: companyId },
      }).catch(() => undefined);
    }
  });

  it('should create and retrieve a BenefitPlan with statutory vector mapping', async () => {
    const plan = await prisma.benefitPlan.create({
      data: {
        companyId,
        name: 'Standard Section 125 High Deductible Health Plan',
        planType: 'SECTION_125_HEALTH',
        treatmentKey: 'SEC_125_HEALTH',
        employerMode: 'FIXED',
        employerRate: 250.0,
      },
    });

    expect(plan.id).toBeDefined();
    expect(plan.name).toBe('Standard Section 125 High Deductible Health Plan');
    expect(plan.planType).toBe('SECTION_125_HEALTH');
    expect(plan.isActive).toBe(true);

    const fetched = await prisma.benefitPlan.findUnique({
      where: { id: plan.id },
    });
    expect(fetched?.treatmentKey).toBe('SEC_125_HEALTH');
  });

  it('should create an EmployeeDeduction linked to company, employee, and plan', async () => {
    const plan = await prisma.benefitPlan.create({
      data: {
        companyId,
        name: '401(k) Retirement Plan',
        planType: 'SECTION_401K_TRADITIONAL',
        treatmentKey: 'SEC_401K_TRAD',
        employerMode: 'MATCH',
        employerRate: 0.04,
      },
    });

    const deduction = await prisma.employeeDeduction.create({
      data: {
        companyId,
        employeeId,
        planId: plan.id,
        amountType: 'PERCENT_GROSS',
        employeeAmount: 0.05,
        employerAmount: 0.04,
        annualLimit: 23500.0,
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: new Date('2026-12-31'),
      },
    });

    expect(deduction.id).toBeDefined();
    expect(deduction.amountType).toBe('PERCENT_GROSS');
    expect(Number(deduction.employeeAmount)).toBe(0.05);
    expect(Number(deduction.annualLimit)).toBe(23500.0);
  });

  it('should create PayrollTaxLiability ledger entries with UNPAID default status', async () => {
    const liability = await prisma.payrollTaxLiability.create({
      data: {
        companyId,
        taxYearId,
        agencyCode: 'IRS',
        taxType: 'FIT',
        amount: 450.75,
        liabilityPeriodEnd: new Date('2026-03-31'),
        statutoryDueDate: new Date('2026-04-15'),
        status: 'UNPAID',
      },
    });

    expect(liability.id).toBeDefined();
    expect(liability.status).toBe('UNPAID');
    expect(Number(liability.amount)).toBe(450.75);
    expect(liability.agencyCode).toBe('IRS');
  });

  it('should create an AchBatch with encrypted payload and enforce unique file hash', async () => {
    const fakeHash = `sha256_dummy_hash_${timestamp}`;
    const encryptedNacha = 'enc:aes-256-gcm:fakeiv:faketag:fakeciphertext';

    const batch = await prisma.achBatch.create({
      data: {
        companyId,
        batchType: 'PPD_DIRECT_DEPOSIT',
        effectiveEntryDate: new Date('2026-04-01'),
        entryCount: 2,
        totalAmount: 2850.5,
        fileContentEncrypted: encryptedNacha,
        fileHashSha256: fakeHash,
        status: 'GENERATED',
      },
    });

    expect(batch.id).toBeDefined();
    expect(batch.batchType).toBe('PPD_DIRECT_DEPOSIT');
    expect(batch.fileHashSha256).toBe(fakeHash);

    // Enforce uniqueness constraint on [companyId, fileHashSha256]
    await expect(
      prisma.achBatch.create({
        data: {
          companyId,
          batchType: 'PPD_DIRECT_DEPOSIT',
          effectiveEntryDate: new Date('2026-04-01'),
          entryCount: 2,
          totalAmount: 2850.5,
          fileContentEncrypted: encryptedNacha,
          fileHashSha256: fakeHash,
        },
      }),
    ).rejects.toThrow();
  });

  it('should allocate settlement payment from AchBatch to PayrollTaxLiability', async () => {
    const liability = await prisma.payrollTaxLiability.create({
      data: {
        companyId,
        taxYearId,
        agencyCode: 'PA_DOR',
        taxType: 'PA_PIT',
        amount: 153.5,
        liabilityPeriodEnd: new Date('2026-03-31'),
        statutoryDueDate: new Date('2026-04-30'),
        status: 'UNPAID',
      },
    });

    const batch = await prisma.achBatch.create({
      data: {
        companyId,
        batchType: 'CCD_TAX_PAYMENT',
        effectiveEntryDate: new Date('2026-04-28'),
        entryCount: 1,
        totalAmount: 153.5,
        fileContentEncrypted: 'enc:aes256:testpayload',
        fileHashSha256: `tax_hash_${timestamp}`,
      },
    });

    const allocation = await prisma.taxPaymentAllocation.create({
      data: {
        companyId,
        liabilityId: liability.id,
        achBatchId: batch.id,
        amount: 153.5,
      },
    });

    expect(allocation.id).toBeDefined();
    expect(Number(allocation.amount)).toBe(153.5);
    expect(allocation.liabilityId).toBe(liability.id);
  });
});
