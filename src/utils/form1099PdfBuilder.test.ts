import { describe, it, expect } from 'vitest';
import { generateForm1099NecPdf } from './form1099PdfBuilder';

describe('form1099PdfBuilder', () => {
  const samplePayer = {
    name: 'Acme Software Solutions LLC',
    tin: '12-3456789',
    address: '100 Main Street',
    city: 'Philadelphia',
    state: 'PA',
    zip: '19104',
    phone: '215-555-0100',
  };

  const samplePayee = {
    legalName: 'Dave Miller',
    businessName: 'Miller Creative Studio',
    tinPlain: '123-45-6789',
    address: '456 Oak Avenue',
    city: 'West Chester',
    state: 'PA',
    zip: '19382',
    box1Compensation: 1850.00,
  };

  it('generates a 2-page landscape PDF document for Copy B and C', () => {
    const doc = generateForm1099NecPdf(samplePayee, samplePayer, '2026');
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(2);

    const buffer = doc.output('arraybuffer');
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });

  it('handles payee without separate business name', () => {
    const payeeNoDba = {
      ...samplePayee,
      businessName: null,
    };
    const doc = generateForm1099NecPdf(payeeNoDba, samplePayer, '2026');
    expect(doc.getNumberOfPages()).toBe(2);
  });
});
