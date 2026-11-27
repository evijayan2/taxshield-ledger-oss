import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Organization } from '../../src/types';
import type { W2EmployeeSummary } from '../../src/utils/w2w3Data';

const mockDoc = {
  setProperties: vi.fn(),
  setLineWidth: vi.fn(),
  setDrawColor: vi.fn(),
  setLineDashPattern: vi.fn(),
  rect: vi.fn(),
  line: vi.fn(),
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
  splitTextToSize: vi.fn((text: string, maxWidth: number) => {
    const approxCharWidth = 5.7;
    const maxChars = Math.max(1, Math.floor(maxWidth / approxCharWidth));
    if (text.length <= maxChars) return [text];
    const lines: string[] = [];
    for (let i = 0; i < text.length; i += maxChars) {
      lines.push(text.slice(i, i + maxChars));
    }
    return lines;
  }),
  getTextWidth: vi.fn((text: string) => text.length * 5.7),
  addPage: vi.fn(),
};

vi.mock('jspdf', () => ({
  default: vi.fn(function () {
    return mockDoc;
  }),
}));

import { generateW2Pdf } from '../../src/utils/w2w3PdfBuilder';

describe('w2w3PdfBuilder', () => {
  const org: Organization = {
    id: 'org-1',
    name: 'Acme Micro LLC',
    ein: '12-3456789',
    address: '100 Main St',
    city: 'Downingtown',
    state: 'PA',
    zip: '19335',
    stateTaxId: 'PA-00000000',
    ownerName: 'Jane Owner',
    ownerEmail: 'owner@acme.example',
  };

  const baseW2: W2EmployeeSummary = {
    employeeId: 'emp-12345678',
    employeeName: 'Abirami Natarajan',
    employeeFirstName: 'Abirami',
    employeeLastName: 'Natarajan',
    employeeSsn: 'XXX-XX-7890',
    employeeAddress: '542 Prizer ct',
    employeeCityStateZip: 'Downingtown, PA 19335',
    boxes: {
      box1Wages: 800,
      box2FedTax: 0,
      box3SsWages: 800,
      box4SsTax: 49.6,
      box5MedWages: 800,
      box6MedTax: 11.6,
      box13Statutory: false,
      box13RetirementPlan: false,
      box13ThirdPartySick: false,
      box14Other: '',
      box15State: 'PA',
      box15StateId: 'PA-00000000',
      box16StateWages: 800,
      box17StateTax: 24.56,
      box18LocalWages: 800,
      box19LocalTax: 0,
      box20Locality: 'East Brandywine Township (Downingtown Area SD)',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allocates sufficient width to Box 20 and avoids overlapping Box 19', () => {
    generateW2Pdf(baseW2, org);

    const box20Rect = mockDoc.rect.mock.calls.find(
      (c) => c[0] === 40 && c[1] === 365 && c[3] === 35
    );
    const box19Rect = mockDoc.rect.mock.calls.find(
      (c) => c[1] === 365 && c[3] === 35 && c[0] > 40
    );

    expect(box20Rect).toBeDefined();
    expect(box19Rect).toBeDefined();
    expect(box20Rect![2]).toBeGreaterThanOrEqual(350);
    expect(box19Rect![0]).toBe(box20Rect![0] + box20Rect![2]);

    const localityTextCalls = mockDoc.text.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('East Brandywine')
    );
    expect(localityTextCalls.length).toBeGreaterThan(0);
    for (const call of localityTextCalls) {
      expect(mockDoc.getTextWidth(call[0])).toBeLessThanOrEqual(box20Rect![2] - 8);
    }
  });

  it('wraps and constrains extremely long locality names inside Box 20', () => {
    const longLocality =
      'East Brandywine Township / Downingtown Area School District (Chester County PA Tax Collector)';
    const w2Long: W2EmployeeSummary = {
      ...baseW2,
      boxes: { ...baseW2.boxes, box20Locality: longLocality },
    };

    generateW2Pdf(w2Long, org);

    const box20Rect = mockDoc.rect.mock.calls.find(
      (c) => c[0] === 40 && c[1] === 365 && c[3] === 35
    );
    expect(box20Rect).toBeDefined();
    expect(mockDoc.splitTextToSize).toHaveBeenCalled();

    const localityCalls = mockDoc.text.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[1] === 44 && c[2] > 365 && c[2] < 400
    );
    expect(localityCalls.length).toBeGreaterThanOrEqual(1);
    for (const call of localityCalls) {
      expect(mockDoc.getTextWidth(call[0])).toBeLessThanOrEqual(box20Rect![2] - 8);
    }
  });
});
