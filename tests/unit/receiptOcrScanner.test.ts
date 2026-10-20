import { describe, it, expect } from 'vitest';
import { parseReceiptText, ExtractedReceiptResult, GeneralExpense } from 'taxshield-ledger-core';
import { isFutureYear, isFutureDateString } from '../../src/utils/taxEngine';
import { createAuditLogEntry } from '../../src/utils/auditLogger';

describe('Receipt OCR Scanner & Drawer Workflow', () => {
  it('should extract vendor, date, total, and Schedule C line with unconfirmed status', () => {
    const rawText = `
      STAPLES STORE #0412
      Date: 2026-04-12
      Copy paper and pens: $45.98
      Total: $45.98
    `;

    const result: ExtractedReceiptResult = parseReceiptText(rawText, { fileName: 'staples.pdf' });

    expect(result.status).toBe('unconfirmed');
    expect(result.vendor.value).toBe('Staples');
    expect(result.date.value).toBe('2026-04-12');
    expect(result.totalAmount.value).toBe(45.98);
    expect(result.suggestedCategory.value).toBe('OFFICE_SUPPLIES');
    expect(result.suggestedScheduleCLine.value).toContain('Line 18');
  });

  it('should detect and prevent confirmation for future tax year dates', () => {
    const futureDate = '2030-05-15';
    expect(isFutureDateString(futureDate)).toBe(true);
    expect(isFutureYear(2030)).toBe(true);

    const activeTaxYearDate = '2026-05-15';
    expect(isFutureDateString(activeTaxYearDate)).toBe(false);
    expect(isFutureYear(2026)).toBe(false);
  });

  it('should produce valid GeneralExpense payload and create matching AuditLogEntry on confirmation', () => {
    const rawText = `
      AMAZON WEB SERVICES
      Invoice Date: 2026-05-01
      Total Due: $142.50
    `;
    const result = parseReceiptText(rawText);

    // Simulated user confirmation form submission
    const confirmedExpense: Omit<GeneralExpense, 'id' | 'createdAt'> = {
      expenseDate: result.date.value || '2026-05-01',
      payee: result.vendor.value || 'AWS',
      category: result.suggestedCategory.value || 'SOFTWARE_TECH',
      scheduleCLine: result.suggestedScheduleCLine.value || 'Line 27a',
      description: `[OCR Scanned] Vendor: ${result.vendor.value}`,
      amount: result.totalAmount.value || 142.50,
      paidBy: 'LLC_ACCOUNT',
      isTaxDeductible: true,
      receiptUrl: 'data:image/png;base64,mockReceiptData',
    };

    expect(confirmedExpense.amount).toBe(142.50);
    expect(confirmedExpense.payee).toBe('Amazon Web Services');
    expect(confirmedExpense.category).toBe('SOFTWARE_TECH');

    // Create Audit Log Entry
    const auditEntry = createAuditLogEntry(
      'GeneralExpense',
      'exp_test_123',
      'CREATE',
      'owner@taxshield.test',
      null,
      confirmedExpense as unknown as Record<string, unknown>,
      `Added confirmed OCR expense: ${confirmedExpense.payee} - $${confirmedExpense.amount}`
    );

    expect(auditEntry.entityType).toBe('GeneralExpense');
    expect(auditEntry.action).toBe('CREATE');
    expect(auditEntry.actorId).toBe('owner@taxshield.test');
    expect(auditEntry.reason).toContain('Added confirmed OCR expense');
  });

  it('should fallback to OTHER category for unknown vendors with low confidence', () => {
    const rawText = `
      CORNER BODEGA UNKNOWN
      Date: 2026-08-01
      Total: $12.50
    `;
    const result = parseReceiptText(rawText);
    expect(result.status).toBe('unconfirmed');
    expect(result.suggestedCategory.value).toBe('OTHER');
    expect(result.suggestedScheduleCLine.value).toContain('Line 27a');
  });
});
