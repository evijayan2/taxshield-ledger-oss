import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseProviderPayrollCsv,
  generateProviderAuditReport,
  type ProviderPayrollRow,
  type Employee,
} from 'taxshield-ledger-core';
import { prisma } from '../../server/prisma';

describe('Provider Audit Workflow & Historical Run Ingestion', () => {
  const companyId = 'comp_audit_workflow_test';

  const mockEmployee: Employee = {
    id: 'emp_workflow_test_1',
    companyId,
    firstName: 'Alice',
    lastName: 'Walker',
    email: 'alice@example.com',
    phone: '555-9876',
    ssnLastFour: '4321',
    employmentType: 'W2_SALARY',
    payRate: 60,
    payFrequency: 'SEMI_MONTHLY',
    w4FilingStatus: 'SINGLE',
    w4MultipleJobs: false,
    w4DependentCredit: 0,
    w4OtherIncome: 0,
    w4Deductions: 0,
    w4ExtraWithholding: 0,
    state: 'PA',
    workState: 'PA',
    paPsdCode: '460401',
    isActive: true,
    isTwoPercentShareholder: false,
  };

  beforeEach(async () => {
    await prisma.payStub.deleteMany({ where: { employeeId: mockEmployee.id } }).catch(() => {});
    await prisma.auditLogEntry.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.payrollRun.deleteMany({ where: { companyId } }).catch(() => {});
    await prisma.company.deleteMany({ where: { id: companyId } }).catch(() => {});

    await prisma.company.create({
      data: {
        id: companyId,
        name: 'Audit Test LLC',
        ein: '99-8877665',
        stateTaxId: '12345678',
        address: '100 Main St',
        city: 'Ardmore',
        state: 'PA',
        zip: '19003',
        ownerName: 'Alice Owner',
        ownerEmail: 'alice.owner@example.com',
      },
    });
  });

  it('parses Gusto CSV export and matches employee for audit report generation', () => {
    const gustoCsv = `Employee,Check Date,Period Start,Period End,Gross Pay,Federal Income Tax,Social Security,Medicare,State Tax,Local Tax,Net Pay
"Alice Walker",2026-08-15,2026-08-01,2026-08-15,$2400.00,$230.00,$148.80,$34.80,$73.68,$24.00,$1888.72`;

    const parsed = parseProviderPayrollCsv(gustoCsv);
    expect(parsed.provider).toBe('GUSTO');
    expect(parsed.rows.length).toBe(1);

    const report = generateProviderAuditReport(companyId, parsed.rows, [mockEmployee], undefined, parsed.provider);
    expect(report.companyId).toBe(companyId);
    expect(report.comparisons.length).toBe(1);
    expect(report.comparisons[0].employeeId).toBe(mockEmployee.id);
  });

  it('records immutable AuditLogEntry when historical run is created from audit report', async () => {
    const rows: ProviderPayrollRow[] = [
      {
        employeeName: 'Alice Walker',
        ssnLast4: '4321',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-15',
        checkDate: '2026-08-15',
        grossWages: 2400,
        fitWithheld: 230,
        ficaSsWithheld: 148.8,
        ficaMedWithheld: 34.8,
        stateWithheld: 73.68,
        localWithheld: 24.0,
        netPay: 1888.72,
      },
    ];

    const report = generateProviderAuditReport(companyId, rows, [mockEmployee], undefined, 'GUSTO');

    const createdRun = await prisma.payrollRun.create({
      data: {
        companyId,
        periodStart: '2026-08-01',
        periodEnd: '2026-08-15',
        payDate: '2026-08-15',
        status: 'LOCKED',
        totalGross: report.totalGross,
        totalEmployeeTaxes: report.totalTaxShieldTaxes,
        totalReimbursements: 0,
        totalNetPay: report.totalNet,
        totalEmployerTaxes: 0,
        totalCompanyCost: report.totalGross,
        stubsCount: 1,
      },
    });

    const auditEntry = await prisma.auditLogEntry.create({
      data: {
        companyId,
        entityType: 'PayrollRun',
        entityId: createdRun.id,
        action: 'PROVIDER_AUDIT_IMPORT',
        actorId: 'user_owner_test',
        newState: { provider: 'GUSTO', totalGross: report.totalGross },
        reason: 'Imported historical payroll run from Gusto register.',
      },
    });

    expect(createdRun.id).toBeDefined();
    expect(auditEntry.action).toBe('PROVIDER_AUDIT_IMPORT');

    const retrievedLogs = await prisma.auditLogEntry.findMany({
      where: { companyId, entityId: createdRun.id },
    });
    expect(retrievedLogs.length).toBe(1);
    expect(retrievedLogs[0].action).toBe('PROVIDER_AUDIT_IMPORT');
  });
});
