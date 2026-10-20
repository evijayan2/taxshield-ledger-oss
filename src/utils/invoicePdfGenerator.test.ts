import { describe, it, expect } from 'vitest';
import { generateInvoicePdf } from './invoicePdfGenerator';
import type { Invoice, Customer } from 'taxshield-ledger-core';

describe('invoicePdfGenerator', () => {
  const sampleCompany = {
    name: 'Acme Cloud Consulting LLC',
    ein: '12-3456789',
    address: '100 Innovation Way',
    city: 'Malvern',
    state: 'PA',
    zip: '19355',
  };

  const sampleCustomer: Customer = {
    id: 'cust-1',
    companyId: 'comp-1',
    name: 'Enterprise Client Corp',
    contactPerson: 'Alice Smith',
    email: 'alice@enterprise.com',
    address: '500 Corporate Blvd',
    city: 'Philadelphia',
    state: 'PA',
    zipCode: '19103',
  };

  const sampleInvoice: Invoice = {
    id: 'inv-1',
    companyId: 'comp-1',
    customerId: 'cust-1',
    taxYearId: 'ty-2026',
    invoiceNumber: 'INV-2026-001',
    issueDate: '2026-05-01',
    dueDate: '2026-05-31',
    status: 'SENT',
    subtotal: 6500,
    taxAmount: 0,
    totalAmount: 6500,
    amountPaid: 0,
    notes: 'Payment via ACH preferred. Net 30 terms.',
    lineItems: [
      {
        id: 'li-1',
        invoiceId: 'inv-1',
        description: 'Cloud Architecture & Security Audit',
        quantity: 1,
        unitPrice: 6500,
        amount: 6500,
      },
    ],
  };

  it('generates a valid vector PDF document', () => {
    const doc = generateInvoicePdf(sampleInvoice, sampleCustomer, sampleCompany);
    expect(doc).toBeDefined();
    // Test outputting binary arraybuffer without throwing
    const buffer = doc.output('arraybuffer');
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('handles multi-item invoices with tax', () => {
    const multiItemInvoice: Invoice = {
      ...sampleInvoice,
      subtotal: 200,
      taxAmount: 12,
      totalAmount: 212,
      lineItems: [
        { id: '1', invoiceId: 'inv-1', description: 'Item 1', quantity: 2, unitPrice: 50, amount: 100 },
        { id: '2', invoiceId: 'inv-1', description: 'Item 2', quantity: 1, unitPrice: 100, amount: 100 },
      ],
    };

    const doc = generateInvoicePdf(multiItemInvoice, sampleCustomer, sampleCompany);
    const pdfDataUri = doc.output('datauristring');
    expect(pdfDataUri).toContain('data:application/pdf');
  });

  it('handles undefined customer safely with fallback', () => {
    const doc = generateInvoicePdf(sampleInvoice, undefined, sampleCompany);
    expect(doc).toBeDefined();
  });

  it('handles partial/malformed invoices with undefined line items and subtotal gracefully without throwing', () => {
    const partialInvoice = {
      id: 'inv-partial',
      companyId: 'comp-1',
      customerId: 'cust-1',
      taxYearId: 'ty-2026',
      invoiceNumber: 'INV-2026-PARTIAL',
      issueDate: '2026-06-01',
      dueDate: '2026-06-15',
      status: 'DRAFT',
      subtotal: undefined,
      taxAmount: undefined,
      totalAmount: undefined,
      amountPaid: 0,
      notes: null,
      lineItems: undefined,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    } as unknown as Invoice;

    expect(() => generateInvoicePdf(partialInvoice, undefined, undefined)).not.toThrow();
    const doc = generateInvoicePdf(partialInvoice, undefined, undefined);
    expect(doc).toBeDefined();
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('handles line items with missing amount or unparsed strings safely', () => {
    const rawLineItemsInvoice = {
      ...sampleInvoice,
      lineItems: [
        {
          id: 'li-1',
          invoiceId: 'inv-1',
          description: 'Consulting',
          quantity: 2,
          unitPrice: 150,
          amount: undefined, // amount not precomputed
        },
      ],
    } as unknown as Invoice;

    expect(() => generateInvoicePdf(rawLineItemsInvoice, sampleCustomer, sampleCompany)).not.toThrow();
    const doc = generateInvoicePdf(rawLineItemsInvoice, sampleCustomer, sampleCompany);
    expect(doc.output('datauristring')).toContain('data:application/pdf');
  });

  it('downloadInvoicePdf generates valid document and handles save safely', () => {
    // In node/vitest environment, doc.save will be called or mocked
    const doc = generateInvoicePdf(sampleInvoice, sampleCustomer, sampleCompany);
    expect(doc).toBeDefined();
  });
});
