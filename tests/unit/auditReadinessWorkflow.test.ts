import { describe, it, expect } from 'vitest';
import {
  calculateAuditReadiness,
  detectDuplicateExpenses,
  evaluateExpenseAudit,
} from 'taxshield-ledger-core';
import { GeneralExpense, MileageLog } from '../../src/types';
import { BankTransaction, ContractorPayment, FormW9Record } from '../../src/types';

describe('Feature 3.5: Audit Readiness & Duplicate Detection Workflow', () => {
  const sampleExpenses: GeneralExpense[] = [
    {
      id: 'exp_1',
      expenseDate: '2026-04-10',
      amount: 145.00,
      payee: 'Office Depot',
      description: 'Ergonomic keyboard and desk accessories',
      category: 'OFFICE_SUPPLIES',
      scheduleCLine: 'Line 18 - Office Expense',
      paidBy: 'LLC_ACCOUNT',
      receiptUrl: 'https://cdn.taxshield.internal/receipts/exp_1.pdf',
    },
    {
      id: 'exp_2',
      expenseDate: '2026-04-12',
      amount: 145.00,
      payee: 'OFFICE DEPOT #0421',
      description: 'Office accessories',
      category: 'OFFICE_SUPPLIES',
      scheduleCLine: 'Line 18 - Office Expense',
      paidBy: 'LLC_ACCOUNT',
      // duplicate suspect with exp_1 (same amount $145.00, within 2 days, matching payee)
    },
    {
      id: 'exp_3',
      expenseDate: '2026-05-15',
      amount: 85.00,
      payee: 'Figma Design',
      description: 'UI prototyping license',
      category: 'SOFTWARE_TECH',
      scheduleCLine: 'Line 27a - Other Expenses',
      paidBy: 'LLC_ACCOUNT',
      // Missing receipt on >= $75 expense (IRS IRC § 274(d) check)
    },
    {
      id: 'exp_4',
      expenseDate: '2026-06-20',
      amount: 22.50,
      payee: 'Coffee Meetup',
      description: 'Business consultation with subcontractor',
      category: 'OTHER',
      scheduleCLine: 'Line 27a - Other Expenses',
      paidBy: 'LLC_ACCOUNT',
      // Under $75 without receipt (IRS Rev. Proc. 95-48 exemption allowed)
    },
  ];

  const sampleBankTxs: BankTransaction[] = [
    {
      id: 'btx_1',
      companyId: 'comp_main',
      batchId: 'batch_1',
      fingerprint: 'fp_1',
      postedDate: '2026-04-11',
      rawDescription: 'POS DEBIT OFFICE DEPOT',
      cleanPayee: 'Office Depot',
      amount: 145.00,
      transactionType: 'DEBIT',
      reconciliationStatus: 'MATCHED',
      matchedEntityId: 'exp_1',
    },
  ];

  const sampleMileage: MileageLog[] = [
    {
      id: 'mil_1',
      employeeId: 'emp_1',
      tripDate: '2026-04-14',
      originLocation: '123 Market St, Philadelphia, PA',
      destinationLocation: '456 King of Prussia Rd, Radnor, PA',
      businessPurpose: 'Client tax strategy meeting',
      startOdometer: 14200,
      endOdometer: 14238,
      calculatedMiles: 38,
      rateApplied: 0.67,
      mileageAllowance: 25.46,
      isReimbursableAccountablePlan: true,
      status: 'APPROVED',
      createdAt: '2026-04-14T12:00:00Z',
    },
  ];

  const sampleContractors: ContractorPayment[] = [
    {
      id: 'cp_1',
      companyId: 'comp_main',
      employeeId: 'emp_contractor_1',
      taxYearId: 'ty_2026',
      paymentDate: '2026-05-01',
      amount: 1500.00, // Exceeds $600 statutory threshold
      paymentMethod: 'ACH',
    },
  ];

  const sampleW9Records: FormW9Record[] = [
    {
      id: 'w9_1',
      companyId: 'comp_main',
      employeeId: 'emp_contractor_1',
      taxClassification: 'INDIVIDUAL_SOLE_PROPRIETOR',
      tinType: 'SSN',
      tinMasked: '***-**-7890',
      tinEncrypted: 'enc_tin_7890',
      address: '789 Developer Blvd',
      city: 'Pittsburgh',
      state: 'PA',
      zipCode: '15213',
      certifiedSignature: 'Jordan Tech',
      certifiedAt: '2026-01-15T09:00:00Z',
      is1099Eligible: true,
    },
  ];

  it('should detect duplicate expense suspect between exp_1 and exp_2', () => {
    const duplicates = detectDuplicateExpenses({
      generalExpenses: sampleExpenses,
    });

    expect(duplicates.length).toBe(1);
    const d = duplicates[0];
    expect(d.severity).toBe('MEDIUM');
    expect(d.dateDeltaDays).toBe(2);
    expect(d.primary.amount).toBe(145.00);
    expect(d.duplicate.amount).toBe(145.00);
    expect(d.suggestedAction).toContain('repeated charge or accidental duplicate entry');
  });

  it('should ignore dismissed duplicate pair keys', () => {
    const duplicates = detectDuplicateExpenses({
      generalExpenses: sampleExpenses,
      dismissedPairKeys: ['exp_1_exp_2'],
    });

    expect(duplicates.length).toBe(0);
  });

  it('should correctly evaluate individual expense audit checks', () => {
    // exp_1: has receipt, purpose, and is reconciled
    const audit1 = evaluateExpenseAudit(sampleExpenses[0], true, false);
    expect(audit1.score).toBeGreaterThanOrEqual(95);
    expect(audit1.hasReceipt).toBe(true);
    expect(audit1.hasPurpose).toBe(true);

    // exp_3: $85 expense without receipt
    const audit3 = evaluateExpenseAudit(sampleExpenses[2], false, false);
    expect(audit3.hasReceipt).toBe(false);
    expect(audit3.score).toBeLessThan(75);
    const receiptReqCheck = audit3.checks.find((c) => c.checkName.includes('Receipt Required'));
    expect(receiptReqCheck?.passed).toBe(false);

    // exp_4: $22.50 expense without receipt (< $75 exemption)
    const audit4 = evaluateExpenseAudit(sampleExpenses[3], false, false);
    const exemptCheck = audit4.checks.find((c) => c.checkName.includes('Optional'));
    expect(exemptCheck?.passed).toBe(true);
  });

  it('should generate a comprehensive CompanyAuditReadinessReport with all 6 pillars', () => {
    const report = calculateAuditReadiness({
      companyId: 'comp_main',
      taxYear: 2026,
      generalExpenses: sampleExpenses,
      bankTransactions: sampleBankTxs,
      mileageLogs: sampleMileage,
      contractorPayments: sampleContractors,
      w9Records: sampleW9Records,
      statutory1099Threshold: 600,
    });

    expect(report.taxYear).toBe(2026);
    expect(report.overallScore).toBeGreaterThanOrEqual(50);
    expect(report.pillars.receiptCoverage).toBeDefined();
    expect(report.pillars.businessPurposeQuality).toBeDefined();
    expect(report.pillars.bankReconciliation).toBeDefined();
    expect(report.pillars.mileageCompleteness).toBeDefined();
    expect(report.pillars.contractorCompliance).toBeDefined();
    expect(report.pillars.duplicateHealth).toBeDefined();

    // Mileage is 100% compliant
    expect(report.pillars.mileageCompleteness.score).toBe(100);

    // Contractor is verified W-9
    expect(report.pillars.contractorCompliance.score).toBe(100);

    // Action items should include the missing receipt on exp_3 (>= $75) and the duplicate between exp_1 & exp_2
    const missingReceiptAction = report.actionItems.find((a) => a.id === 'missing_receipt_exp_3');
    expect(missingReceiptAction).toBeDefined();
    expect(missingReceiptAction?.severity).toBe('CRITICAL');
    expect(missingReceiptAction?.irsReference).toBe('IRC § 274(d)');

    const duplicateAction = report.actionItems.find((a) => a.entityType === 'DUPLICATE');
    expect(duplicateAction).toBeDefined();
  });
});
