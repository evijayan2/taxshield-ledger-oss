import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  decomposePayStubsToLiabilities,
  buildFederal941Bundle,
  buildStateRemittanceSummaries,
  generateTXPAddenda,
  getQuarterEndDate,
  calculateStatutoryDueDate,
  PayStub,
} from 'taxshield-ledger-core';
import { prisma } from '../../server/prisma';

describe('Payroll Liability & Payment Concierge Workflow', () => {
  const companyId = 'comp_concierge_test';
  const runId = 'run_concierge_test_1';
  const taxYearId = 'ty_concierge_test_2026';

  const sampleStubs: Partial<PayStub>[] = [
    {
      id: 'stub_1',
      federalIncomeTax: 250,
      socialSecurityTax: 186,
      employerSocialSecurity: 186,
      medicareTax: 43.5,
      employerMedicare: 43.5,
      paStateTax: 92.1,
      employerPaUc: 105.0,
      localIncomeTax: 30.0,
      localFlatTax: 2.0,
    },
    {
      id: 'stub_2',
      federalIncomeTax: 150,
      socialSecurityTax: 124,
      employerSocialSecurity: 124,
      medicareTax: 29.0,
      employerMedicare: 29.0,
      paStateTax: 61.4,
      employerPaUc: 70.0,
      localIncomeTax: 20.0,
      localFlatTax: 0.0,
    },
  ];

  beforeEach(async () => {
    // Clean up test records
    await prisma.taxPaymentAllocation.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.payrollTaxLiability.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.auditLogEntry.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.payrollRun.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.taxYear.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.company.deleteMany({ where: { id: companyId } }).catch(() => {});

    // Create test company
    await prisma.company.create({
      data: {
        id: companyId,
        name: 'Concierge Test LLC',
        ein: '12-3456789',
        stateTaxId: '88776655',
        address: '100 Market St',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19103',
        ownerName: 'Jane Owner',
        ownerEmail: 'jane@example.com',
      },
    });

    // Create test tax year
    await prisma.taxYear.create({
      data: {
        id: taxYearId,
        companyId,
        year: 2026,
        status: 'ACTIVE',
      },
    });

    // Create test payroll run
    await prisma.payrollRun.create({
      data: {
        id: runId,
        companyId,
        periodStart: '2026-08-01',
        periodEnd: '2026-08-15',
        payDate: '2026-08-20',
        totalGross: 5000.0,
        totalNetPay: 3800.0,
        totalEmployeeTaxes: 865.0,
        totalEmployerTaxes: 766.5,
        totalReimbursements: 0.0,
        totalCompanyCost: 5766.5,
        stubsCount: 2,
        status: 'LOCKED',
      },
    });
  });

  afterEach(async () => {
    await prisma.taxPaymentAllocation.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.payrollTaxLiability.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.auditLogEntry.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.payrollRun.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.taxYear.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.company.deleteMany({ where: { id: companyId } }).catch(() => {});
  });

  it('decomposes paystubs into discrete statutory liabilities with correct totals', () => {
    const liabilities = decomposePayStubsToLiabilities({
      companyId,
      payrollRunId: runId,
      taxYearId,
      payDate: '2026-08-20',
      periodEnd: '2026-08-15',
      companyState: 'PA',
      payStubs: sampleStubs as PayStub[],
    });

    expect(liabilities.length).toBe(7);

    const fit = liabilities.find((l) => l.taxType === 'FIT');
    const ss = liabilities.find((l) => l.taxType === 'FICA_SS');
    const med = liabilities.find((l) => l.taxType === 'FICA_MED');
    const pit = liabilities.find((l) => l.taxType === 'PA_PIT');
    const uc = liabilities.find((l) => l.taxType === 'PA_UC_EMPLOYER');
    const eit = liabilities.find((l) => l.taxType === 'PA_EIT');
    const lst = liabilities.find((l) => l.taxType === 'PA_LST');

    expect(fit?.amount).toBe(400.0);
    expect(ss?.amount).toBe(620.0);
    expect(med?.amount).toBe(145.0);
    expect(pit?.amount).toBe(153.5);
    expect(uc?.amount).toBe(175.0);
    expect(eit?.amount).toBe(50.0);
    expect(lst?.amount).toBe(2.0);

    expect(fit?.statutoryDueDate).toBe('2026-09-15');
    expect(uc?.statutoryDueDate).toBe('2026-10-31');
  });

  it('generates Federal 941 bundle with quarter end date in 80-character TXP addenda', () => {
    const liabilities = decomposePayStubsToLiabilities({
      companyId,
      payrollRunId: runId,
      taxYearId,
      payDate: '2026-08-20',
      periodEnd: '2026-08-15',
      companyState: 'PA',
      payStubs: sampleStubs as PayStub[],
    });

    const bundle = buildFederal941Bundle(liabilities, '12-3456789', '2026-08-15');
    expect(bundle.totalAmount).toBe(1165.0);
    expect(bundle.liabilityIds.length).toBe(3);
    expect(bundle.taxPeriodEnd).toBe('2026-09-30'); // Q3 calendar quarter end
    expect(bundle.txpAddenda.length).toBe(80);
    expect(bundle.txpAddenda.startsWith('TXP*123456789*01101*260930*116500*M*~')).toBe(true);
    expect(bundle.portalUrl).toBe('https://www.eftps.gov/eftps/');
    expect(bundle.isSettled).toBe(false);
  });

  it('persists liabilities, settles bundle atomically, and creates allocations and audit logs', async () => {
    const liabilities = decomposePayStubsToLiabilities({
      companyId,
      payrollRunId: runId,
      taxYearId,
      payDate: '2026-08-20',
      periodEnd: '2026-08-15',
      companyState: 'PA',
      payStubs: sampleStubs as PayStub[],
    });

    // 1. Create liabilities in DB
    for (const item of liabilities) {
      await prisma.payrollTaxLiability.create({
        data: {
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

    const dbLiabilities = await prisma.payrollTaxLiability.findMany({ where: { companyId } });
    expect(dbLiabilities.length).toBe(7);

    // 2. Settle Federal 941 bundle atomically
    const fedItems = dbLiabilities.filter((l) => l.agencyCode === 'IRS');
    const fedIds = fedItems.map((l) => l.id);
    const confNum = 'EFTPS-99887766';
    const paidDate = new Date('2026-09-14');

    await prisma.$transaction(async (tx) => {
      for (const item of fedItems) {
        await tx.payrollTaxLiability.update({
          where: { id: item.id },
          data: { status: 'SETTLED', confirmationNumber: confNum, paidAt: paidDate },
        });

        await tx.taxPaymentAllocation.create({
          data: { companyId, liabilityId: item.id, amount: item.amount, allocatedAt: paidDate },
        });
      }

      await tx.auditLogEntry.create({
        data: {
          companyId,
          entityType: 'PAYROLL_TAX_LIABILITY_BUNDLE',
          entityId: fedIds.join(','),
          action: 'SETTLE_TAX_LIABILITY_BUNDLE',
          actorId: 'test_owner',
          newState: { liabilityIds: fedIds, confirmationNumber: confNum, count: fedItems.length },
          reason: `Settled ${fedItems.length} liabilities in Federal 941 bundle`,
        },
      });
    });

    const settled = await prisma.payrollTaxLiability.findMany({
      where: { companyId, status: 'SETTLED' },
    });
    expect(settled.length).toBe(3);

    const allocations = await prisma.taxPaymentAllocation.findMany({ where: { companyId } });
    expect(allocations.length).toBe(3);

    const auditEntries = await prisma.auditLogEntry.findMany({ where: { companyId } });
    expect(auditEntries.length).toBe(1);
    expect(auditEntries[0].action).toBe('SETTLE_TAX_LIABILITY_BUNDLE');
  });

  it('settles a single state liability with individual allocation and audit tracking', async () => {
    const singleLiability = await prisma.payrollTaxLiability.create({
      data: {
        id: 'liab_pa_pit_1',
        companyId,
        payrollRunId: runId,
        taxYearId,
        agencyCode: 'PA_DOR',
        taxType: 'PA_PIT',
        amount: 153.5,
        liabilityPeriodEnd: new Date('2026-08-15'),
        statutoryDueDate: new Date('2026-09-15'),
        status: 'UNPAID',
      },
    });

    const conf = 'MYPATH-CONF-12345';
    const paidDate = new Date('2026-09-10');

    await prisma.$transaction(async (tx) => {
      await tx.payrollTaxLiability.update({
        where: { id: singleLiability.id },
        data: { status: 'SETTLED', confirmationNumber: conf, paidAt: paidDate },
      });

      await tx.taxPaymentAllocation.create({
        data: { companyId, liabilityId: singleLiability.id, amount: singleLiability.amount, allocatedAt: paidDate },
      });

      await tx.auditLogEntry.create({
        data: {
          companyId,
          entityType: 'PAYROLL_TAX_LIABILITY',
          entityId: singleLiability.id,
          action: 'SETTLE_TAX_LIABILITY',
          actorId: 'test_owner',
          newState: { confirmationNumber: conf },
          reason: `Settled PA PIT liability`,
        },
      });
    });

    const updated = await prisma.payrollTaxLiability.findUnique({ where: { id: singleLiability.id } });
    expect(updated?.status).toBe('SETTLED');
    expect(updated?.confirmationNumber).toBe(conf);

    const allocation = await prisma.taxPaymentAllocation.findFirst({
      where: { companyId, liabilityId: singleLiability.id },
    });
    expect(allocation).not.toBeNull();
    expect(Number(allocation?.amount)).toBe(153.5);
  });
});
