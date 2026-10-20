import { describe, it, expect } from 'vitest';
import {
  parseBankCsv,
  reconcileBankBatch,
  findCandidateMatches,
  classifyTransaction,
  GeneralExpense,
  PayrollRun,
  Invoice,
  ContractorPayment,
} from 'taxshield-ledger-core';
import { createAuditLogEntry } from '../../src/utils/auditLogger';

describe('Bank Statement Reconciliation Workflow & Heuristics', () => {
  const companyId = 'comp_oss_recon';

  const mockExpenses: GeneralExpense[] = [
    {
      id: 'exp-1',
      expenseDate: '2026-05-01',
      category: 'SOFTWARE_TECH',
      payee: 'Amazon Web Services',
      description: 'Monthly cloud hosting infrastructure',
      amount: 142.50,
      paidBy: 'LLC_ACCOUNT',
      scheduleCLine: '27a',
      isTaxDeductible: true,
    },
    {
      id: 'exp-2',
      expenseDate: '2026-05-12',
      category: 'OFFICE_SUPPLIES',
      payee: 'Staples',
      description: 'Desk accessories and printer paper',
      amount: 84.50,
      paidBy: 'LLC_ACCOUNT',
      scheduleCLine: '18',
      isTaxDeductible: true,
    },
  ];

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      companyId,
      customerId: 'cust-1',
      customerName: 'Acme Corp',
      taxYearId: 'ty-2026',
      invoiceNumber: 'INV-2026-001',
      issueDate: '2026-05-01',
      dueDate: '2026-05-31',
      status: 'PAID',
      subtotal: 6500.0,
      taxAmount: 0,
      totalAmount: 6500.0,
      amountPaid: 6500.0,
      lineItems: [],
    },
  ];

  const mockPayrollRuns: PayrollRun[] = [
    {
      id: 'pay-1',
      periodStart: '2026-04-16',
      periodEnd: '2026-04-30',
      payDate: '2026-05-05',
      status: 'DISBURSED',
      totalGross: 3000.0,
      totalEmployeeTaxes: 450.0,
      totalReimbursements: 0,
      totalNetPay: 2550.0,
      totalEmployerTaxes: 230.0,
      totalCompanyCost: 3230.0,
      stubsCount: 1,
      createdAt: '2026-05-05T00:00:00.000Z',
    },
  ];

  const mockContractorPayments: ContractorPayment[] = [
    {
      id: 'cp-1',
      companyId,
      employeeId: 'emp-contractor-1',
      taxYearId: 'ty-2026',
      paymentDate: '2026-05-08',
      amount: 750.0,
      paymentMethod: 'ACH',
      description: 'Dave Designer Milestone 1',
    },
  ];

  it('should parse Mercury statement and correctly reconcile 4-way ledger entities', () => {
    const csvContent = `"Date","Description","Amount","FITID"
"2026-05-01","Amazon Web Services","-$142.50","tx_001"
"2026-05-02","Stripe Payouts Client Retainer","$6500.00","tx_002"
"2026-05-05","Gusto Payroll Net Pay & Taxes","-$2550.00","tx_003"
"2026-05-08","ACH to Dave Designer","-$750.00","tx_004"
"2026-05-12","Staples Office Supplies","-$84.50","tx_005"
"2026-05-20","Unrecognized Coffee Shop","-$12.00","tx_006"`;

    const parsed = parseBankCsv(csvContent, companyId);
    expect(parsed.success).toBe(true);
    expect(parsed.totalRows).toBe(6);

    const recon = reconcileBankBatch(
      parsed.rows,
      companyId,
      'batch-test-1',
      {
        generalExpenses: mockExpenses,
        invoices: mockInvoices,
        payrollRuns: mockPayrollRuns,
        contractorPayments: mockContractorPayments,
      },
      new Set()
    );

    expect(recon.summary.total).toBe(6);
    expect(recon.summary.matched).toBeGreaterThanOrEqual(4);
    expect(recon.summary.unmatched).toBe(1); // Coffee shop

    // Verify AWS expense matched
    const awsMatch = recon.reconciledRows.find(r => r.transaction.cleanPayee.includes('Amazon'));
    expect(awsMatch?.reconciliationStatus).toBe('MATCHED');
    expect(awsMatch?.matchedEntityType).toBe('GENERAL_EXPENSE');
    expect(awsMatch?.matchedEntityId).toBe('exp-1');

    // Verify Acme Corp invoice matched
    const invMatch = recon.reconciledRows.find(r => r.transaction.amount === 6500);
    expect(invMatch?.matchedEntityType).toBe('INVOICE');
    expect(invMatch?.matchedEntityId).toBe('inv-1');

    // Verify Payroll run matched
    const payMatch = recon.reconciledRows.find(r => r.transaction.amount === 2550);
    expect(payMatch?.matchedEntityType).toBe('PAYROLL_RUN');
    expect(payMatch?.matchedEntityId).toBe('pay-1');

    // Verify Contractor payment matched
    const cpMatch = recon.reconciledRows.find(r => r.transaction.amount === 750);
    expect(cpMatch?.matchedEntityType).toBe('CONTRACTOR_PAYMENT');
    expect(cpMatch?.matchedEntityId).toBe('cp-1');
  });

  it('should prevent duplicate records upon statement re-import', () => {
    const csvContent = `"Date","Description","Amount"\n"2026-05-01","Amazon Web Services","-$142.50"`;
    const parsed = parseBankCsv(csvContent, companyId);

    // First import fingerprint
    const fp = parsed.rows[0].fingerprint;
    const existingFingerprints = new Set([fp]);

    // Second import with existing fingerprint
    const recon = reconcileBankBatch(
      parsed.rows,
      companyId,
      'batch-reimport',
      { generalExpenses: mockExpenses, invoices: [], payrollRuns: [], contractorPayments: [] },
      existingFingerprints
    );

    expect(recon.summary.duplicate).toBe(1);
    expect(recon.reconciledRows[0].reconciliationStatus).toBe('DUPLICATE');
  });

  it('should generate an AuditLogEntry when converting an unmatched bank debit into an expense', () => {
    const unmatchedBankTx = {
      id: 'tx-unmatched-1',
      postedDate: '2026-05-20',
      cleanPayee: 'Figma Subscriptions',
      rawDescription: 'POS DEBIT FIGMA DESIGN SAN FRANCISCO CA',
      amount: 45.00,
    };

    const newExpense: GeneralExpense = {
      id: 'exp-created-from-bank-1',
      expenseDate: unmatchedBankTx.postedDate,
      payee: unmatchedBankTx.cleanPayee,
      category: 'SOFTWARE_TECH',
      description: unmatchedBankTx.rawDescription,
      amount: unmatchedBankTx.amount,
      paidBy: 'LLC_ACCOUNT',
      scheduleCLine: '27a',
      isTaxDeductible: true,
      createdAt: new Date().toISOString(),
    };

    const auditEntry = createAuditLogEntry(
      'BankTransaction',
      unmatchedBankTx.id,
      'UPDATE',
      'owner@taxshield.test',
      { status: 'UNMATCHED' },
      { status: 'MATCHED', matchedEntityId: newExpense.id },
      `Reconciled unmatched bank debit into verified expense on Schedule C Line 27a`
    );

    expect(auditEntry.entityType).toBe('BankTransaction');
    expect(auditEntry.action).toBe('UPDATE');
    expect(auditEntry.actorId).toBe('owner@taxshield.test');
    expect(auditEntry.reason).toContain('Line 27a');
  });
});
