import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../server/prisma.js';
import {
  generatePayrollNachaBatch,
  parseNachaFileSummary,
  encryptString,
  decryptString,
  NachaValidationError,
  type Company,
  type PayStub,
  type Employee,
} from 'taxshield-ledger-core';

function mockStubData(runId: string, empId: string, gross: number, net: number, method: 'ACH' | 'CHECK' = 'ACH') {
  return {
    payrollRunId: runId,
    employeeId: empId,
    periodStart: '2026-11-01',
    periodEnd: '2026-11-15',
    payDate: '2026-11-20',
    hoursWorked: 80,
    overtimeHours: 0,
    hourlyRate: 35.0,
    grossEarnings: gross,
    federalIncomeTax: gross * 0.1,
    socialSecurityTax: gross * 0.062,
    medicareTax: gross * 0.0145,
    totalEmployeeTaxes: gross - net,
    mileageReimbursement: 0,
    travelExpensesReimbursement: 0,
    totalReimbursements: 0,
    netPay: net,
    employerSocialSecurity: gross * 0.062,
    employerMedicare: gross * 0.0145,
    totalEmployerTaxes: gross * 0.1,
    totalCompanyCost: gross * 1.1,
    disbursementMethod: method,
    disbursementStatus: 'PENDING',
  };
}

describe('NACHA Direct Deposit Workflow & AchBatch Persistence (Story 4)', () => {
  const timestamp = Date.now();
  const validOdfiRouting = '021000021';
  const validReceivingRouting1 = '121000248';
  const validReceivingRouting2 = '031000053';

  let companyId: string;
  let taxYearId: string;
  let employee1Id: string;
  let employee2Id: string;
  let payrollRunId: string;
  let payStub1Id: string;
  let payStub2Id: string;

  beforeAll(async () => {
    const company = await prisma.company.create({
      data: {
        name: `NACHA Test LLC ${timestamp}`,
        ein: '12-9876543',
        stateTaxId: '77889900',
        address: '500 Market St',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19106',
        ownerName: 'Alice DirectDeposit',
        ownerEmail: `alice_${timestamp}@nacha.tax`,
        routingNumber: validOdfiRouting,
        accountNumber: '9988776655',
        bankName: 'JPMorgan Chase Bank',
      },
    });
    companyId = company.id;

    const taxYear = await prisma.taxYear.create({
      data: { companyId, year: 2026, status: 'ACTIVE' },
    });
    taxYearId = taxYear.id;

    const emp1 = await prisma.employee.create({
      data: {
        companyId,
        firstName: 'Charlie',
        lastName: 'Direct',
        email: `charlie_${timestamp}@nacha.tax`,
        phone: '215-555-0101',
        ssnLastFour: '1234',
        employmentType: 'FULL_TIME',
        payRate: 35.0,
        payFrequency: 'BI_WEEKLY',
        w4FilingStatus: 'SINGLE',
        routingNumber: validReceivingRouting1,
        accountNumber: '1122334455',
        accountType: 'CHECKING',
        isActive: true,
      },
    });
    employee1Id = emp1.id;

    const emp2 = await prisma.employee.create({
      data: {
        companyId,
        firstName: 'Diana',
        lastName: 'Deposit',
        email: `diana_${timestamp}@nacha.tax`,
        phone: '215-555-0102',
        ssnLastFour: '5678',
        employmentType: 'FULL_TIME',
        payRate: 40.0,
        payFrequency: 'BI_WEEKLY',
        w4FilingStatus: 'SINGLE',
        routingNumber: validReceivingRouting2,
        accountNumber: '6677889900',
        accountType: 'SAVINGS',
        isActive: true,
      },
    });
    employee2Id = emp2.id;

    const payrollRun = await prisma.payrollRun.create({
      data: {
        companyId,
        periodStart: '2026-11-01',
        periodEnd: '2026-11-15',
        payDate: '2026-11-20',
        status: 'CONFIRMED',
        totalGross: 5000.0,
        totalEmployeeTaxes: 1200.0,
        totalReimbursements: 0.0,
        totalNetPay: 3800.0,
        totalEmployerTaxes: 580.0,
        totalCompanyCost: 5580.0,
        stubsCount: 2,
      },
    });
    payrollRunId = payrollRun.id;

    const stub1 = await prisma.payStub.create({
      data: mockStubData(payrollRunId, employee1Id, 3000.0, 2280.0, 'ACH'),
    });
    payStub1Id = stub1.id;

    const stub2 = await prisma.payStub.create({
      data: mockStubData(payrollRunId, employee2Id, 2000.0, 1520.0, 'ACH'),
    });
    payStub2Id = stub2.id;
  });

  afterAll(async () => {
    if (companyId) {
      await prisma.company.delete({ where: { id: companyId } }).catch(() => undefined);
    }
  });

  it('generates a 94-character fixed-width NACHA batch with 10-digit hash', async () => {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const employees = await prisma.employee.findMany({ where: { companyId } });
    const payStubs = await prisma.payStub.findMany({ where: { payrollRunId } });

    const result = generatePayrollNachaBatch(
      company as unknown as Company,
      payStubs as unknown as PayStub[],
      employees as unknown as Employee[],
      { effectiveEntryDate: '2026-11-20', companyEntryDescription: 'PAYROLL' }
    );

    expect(result.lineCount).toBe(10);
    expect(result.entryCount).toBe(2);
    expect(result.totalCreditCents).toBe(380000);
    expect(result.totalDebitCents).toBe(0);
    expect(result.fileHashSha256).toMatch(/^[a-f0-9]{64}$/);

    result.lines.forEach(line => expect(line.length).toBe(94));

    const summary = parseNachaFileSummary(result.fileContent);
    expect(summary.isValid).toBe(true);
    expect(summary.entryCount).toBe(2);
    expect(summary.totalCreditCents).toBe(380000);
  });

  it('transactionally persists AchBatch, encrypts file at rest, and updates paystub trace refs', async () => {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const employees = await prisma.employee.findMany({ where: { companyId } });
    const payStubs = await prisma.payStub.findMany({ where: { payrollRunId } });

    const nachaResult = generatePayrollNachaBatch(
      company as unknown as Company,
      payStubs as unknown as PayStub[],
      employees as unknown as Employee[],
      { effectiveEntryDate: '2026-11-20', companyEntryDescription: 'PAYROLL' }
    );

    const encryptedFile = encryptString(nachaResult.fileContent);

    const createdBatch = await prisma.$transaction(async (tx) => {
      const batch = await tx.achBatch.create({
        data: {
          companyId,
          payrollRunId,
          batchType: 'PPD',
          effectiveEntryDate: new Date('2026-11-20'),
          entryCount: nachaResult.entryCount,
          totalAmount: nachaResult.totalCreditCents / 100,
          fileContentEncrypted: encryptedFile,
          fileHashSha256: nachaResult.fileHashSha256,
          status: 'GENERATED',
        },
      });

      for (const item of nachaResult.updatedPayStubs) {
        await tx.payStub.update({
          where: { id: item.payStubId },
          data: {
            achTraceRef: item.achTraceRef,
            disbursementStatus: 'PAID',
            paidAt: new Date().toISOString(),
          },
        });
      }

      await tx.auditLogEntry.create({
        data: {
          companyId,
          entityType: 'ACH_BATCH',
          entityId: batch.id,
          action: 'GENERATE_NACHA_BATCH',
          actorId: 'test-owner-id',
          newState: {
            batchId: batch.id,
            payrollRunId,
            entryCount: nachaResult.entryCount,
            totalAmount: nachaResult.totalCreditCents / 100,
            fileHashSha256: nachaResult.fileHashSha256,
          },
          reason: 'Direct Deposit NACHA batch test',
          timestamp: new Date(),
        },
      });

      return batch;
    });

    expect(createdBatch.id).toBeDefined();
    expect(createdBatch.entryCount).toBe(2);
    expect(Number(createdBatch.totalAmount)).toBe(3800.0);

    const decrypted = decryptString(createdBatch.fileContentEncrypted);
    expect(decrypted).toBe(nachaResult.fileContent);

    const updatedStub1 = await prisma.payStub.findUniqueOrThrow({ where: { id: payStub1Id } });
    expect(updatedStub1.achTraceRef).toBe('021000020000001');
    expect(updatedStub1.disbursementStatus).toBe('PAID');

    const updatedStub2 = await prisma.payStub.findUniqueOrThrow({ where: { id: payStub2Id } });
    expect(updatedStub2.achTraceRef).toBe('021000020000002');
    expect(updatedStub2.disbursementStatus).toBe('PAID');

    const audit = await prisma.auditLogEntry.findFirst({
      where: { companyId, entityType: 'ACH_BATCH', action: 'GENERATE_NACHA_BATCH' },
    });
    expect(audit).toBeDefined();
    expect(audit?.actorId).toBe('test-owner-id');
  });

  it('rejects payroll batch generation when no ACH paystubs exist', async () => {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const employees = await prisma.employee.findMany({ where: { companyId } });
    const checkStubs = [mockStubData('run-check', employee1Id, 1000, 800, 'CHECK') as unknown as PayStub];

    expect(() =>
      generatePayrollNachaBatch(
        company as unknown as Company,
        checkStubs,
        employees as unknown as Employee[],
        { effectiveEntryDate: '2026-11-20' }
      )
    ).toThrow(NachaValidationError);
  });
});
