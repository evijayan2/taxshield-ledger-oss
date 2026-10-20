import { describe, it, expect } from 'vitest';
import { calculateDueDate } from 'taxshield-ledger-core';
import type { Invoice, Customer } from 'taxshield-ledger-core';
import { createAuditLogEntry } from '../../src/utils/auditLogger';

describe('Invoicing Workflow & Defensiveness', () => {
  it('calculates due date correctly based on payment terms', () => {
    expect(calculateDueDate('2026-05-01', 'DUE_ON_RECEIPT')).toBe('2026-05-01');
    expect(calculateDueDate('2026-05-01', 'NET_15')).toBe('2026-05-16');
    expect(calculateDueDate('2026-05-01', 'NET_30')).toBe('2026-05-31');
    expect(calculateDueDate('2026-05-01', 'NET_60')).toBe('2026-06-30');
  });

  it('safely handles invoices with undefined totalAmount or empty fields without throwing', () => {
    // Simulates an invoice object created with missing fields or partial data
    const partialInvoice = {
      id: 'inv_test_1',
      customerId: 'cust_1',
      issueDate: '2026-05-01',
      // totalAmount is missing
    } as unknown as Invoice;

    const invoices = [partialInvoice];

    // Compute metrics as in InvoicingView
    const totalBilled = (invoices || []).reduce(
      (acc, inv) => acc + (inv?.status !== 'VOID' ? Number(inv?.totalAmount || 0) : 0),
      0
    );
    const totalPaid = (invoices || [])
      .filter((i) => i?.status === 'PAID')
      .reduce((acc, i) => acc + Number(i?.amountPaid || 0), 0);
    const totalOutstanding = (invoices || [])
      .filter((i) => i?.status === 'SENT' || i?.status === 'VIEWED' || i?.status === 'OVERDUE')
      .reduce((acc, i) => acc + (Number(i?.totalAmount || 0) - Number(i?.amountPaid || 0)), 0);

    expect(Number(totalBilled || 0).toFixed(2)).toBe('0.00');
    expect(Number(totalPaid || 0).toFixed(2)).toBe('0.00');
    expect(Number(totalOutstanding || 0).toFixed(2)).toBe('0.00');
    expect(Number(partialInvoice.totalAmount || 0).toFixed(2)).toBe('0.00');
  });

  it('constructs a full Invoice record from draft drawer input', () => {
    const customer: Customer = {
      id: 'cust_acme',
      companyId: 'comp_main',
      name: 'Acme Corp',
      email: 'billing@acme.com',
    };

    const drawerInput = {
      customerId: customer.id,
      issueDate: '2026-06-01',
      paymentTerms: 'NET_30' as const,
      lineItems: [
        { description: 'Cloud Architecture & Migration', quantity: 2, unitPrice: 1500 },
        { description: 'Security Hardening', quantity: 1, unitPrice: 750 },
      ],
      taxAmount: 225,
      notes: 'Net 30 payment via wire or card',
    };

    const subtotal = drawerInput.lineItems.reduce(
      (acc, it) => acc + it.quantity * it.unitPrice,
      0
    );
    const totalAmount = subtotal + drawerInput.taxAmount;
    const dueDate = calculateDueDate(drawerInput.issueDate, drawerInput.paymentTerms);

    const invoiceId = `inv_${Date.now()}`;
    const invoice: Invoice = {
      id: invoiceId,
      companyId: 'comp_main',
      customerId: customer.id,
      customerName: customer.name,
      taxYearId: 'ty_2026',
      invoiceNumber: 'INV-2026-001',
      issueDate: drawerInput.issueDate,
      dueDate,
      status: 'DRAFT',
      subtotal,
      taxAmount: drawerInput.taxAmount,
      totalAmount,
      amountPaid: 0,
      notes: drawerInput.notes,
      lineItems: drawerInput.lineItems.map((it, idx) => ({
        id: `item_${idx}`,
        invoiceId,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.quantity * it.unitPrice,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(invoice.subtotal).toBe(3750);
    expect(invoice.totalAmount).toBe(3975);
    expect(invoice.totalAmount.toFixed(2)).toBe('3975.00');
    expect(invoice.dueDate).toBe('2026-07-01');
    expect(invoice.lineItems).toHaveLength(2);
    expect(invoice.lineItems[0].amount).toBe(3000);
  });

  it('filters and deletes invoices by ID or fallback INV-DRAFT identifier', () => {
    const list: any[] = [
      { id: 'inv_1', invoiceNumber: 'INV-2026-001', totalAmount: 100 },
      { id: undefined, invoiceNumber: undefined, totalAmount: 0 }, // Corrupted remnant
    ];

    const identifier = 'INV-DRAFT';
    const target = list.find((i) => i.id === identifier || i.invoiceNumber === identifier || (!i.id && identifier === 'INV-DRAFT'));
    expect(target).toBeDefined();

    const remaining = list.filter((i) => i !== target && i.id !== identifier && i.invoiceNumber !== identifier);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].invoiceNumber).toBe('INV-2026-001');
  });

  it('safely updates invoice status on corrupt or missing-id invoice and produces non-null audit entry', () => {
    const list: any[] = [
      { id: undefined, invoiceNumber: undefined, totalAmount: 500, amountPaid: 0, status: 'DRAFT' },
    ];

    const identifier = 'INV-DRAFT';
    const target = list.find((i) => (identifier ? (i.id === identifier || i.invoiceNumber === identifier) : (!i.id && !i.invoiceNumber)) || (!i.id && identifier === 'INV-DRAFT'));
    expect(target).toBeDefined();

    const resolvedId = target.id || identifier || 'INV-DRAFT';
    const resolvedInvoiceNumber = target.invoiceNumber || 'INV-DRAFT';
    const updatedInvoice = {
      ...target,
      id: resolvedId,
      invoiceNumber: resolvedInvoiceNumber,
      status: 'PAID',
      amountPaid: target.totalAmount,
    };

    const auditEntry = createAuditLogEntry(
      'Invoice',
      resolvedId,
      'UPDATE',
      'owner@example.com',
      target,
      updatedInvoice,
      `Updated invoice ${resolvedInvoiceNumber} status to PAID`
    );

    expect(auditEntry.entityId).toBe('INV-DRAFT');
    expect(auditEntry.entityId).not.toBeNull();
    expect(auditEntry.entityId).not.toBeUndefined();
    expect(auditEntry.reason).toContain('Updated invoice INV-DRAFT status to PAID');
  });

  it('ensures createAuditLogEntry generates a valid entityId fallback when entityId is null or empty', () => {
    // If entityId is passed as empty or undefined, audit logger must provide fallback
    const entry1 = createAuditLogEntry('Invoice', '' as any, 'UPDATE', 'owner');
    expect(entry1.entityId).toBeDefined();
    expect(entry1.entityId.length).toBeGreaterThan(0);
    expect(entry1.entityId).not.toBe('');

    const entryWithState = createAuditLogEntry(
      'Invoice',
      undefined as any,
      'UPDATE',
      'owner',
      { id: 'inv_from_prev' },
      null
    );
    expect(entryWithState.entityId).toBe('inv_from_prev');
  });
});
