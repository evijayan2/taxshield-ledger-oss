import jsPDF from 'jspdf';
import type { FormW9Record, ContractorPayment } from 'taxshield-ledger-core';

export interface Form1099PayerProfile {
  name: string;
  tin: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
}

export interface Form1099PayeeData {
  legalName: string;
  businessName?: string | null;
  tinPlain: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  box1Compensation: number;
  box4FederalWithheld?: number;
}

/**
 * Draws an IRS styled box container with title label and value.
 * @param doc jsPDF instance.
 * @param x Horizontal coordinate.
 * @param y Vertical coordinate.
 * @param w Width in points.
 * @param h Height in points.
 * @param label Top field title.
 * @param val Main display value.
 */
function drawFieldBox(doc: jsPDF, x: number, y: number, w: number, h: number, label: string, val: string): void {
  doc.setDrawColor(180, 190, 205);
  doc.rect(x, y, w, h, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(label.toUpperCase(), x + 4, y + 9);

  if (val) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(val, x + 4, y + 22);
  }
}

/**
 * Formats a dollar amount into clean currency.
 * @param num Amount.
 * @returns Formatted USD string.
 */
function fmt(num: number): string {
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generates an official IRS Form 1099-NEC vector PDF (Copy B & Copy C).
 * @param payee Recipient contractor details and annual compensation.
 * @param payer Payer company identity.
 * @param taxYear 4-digit tax year string.
 * @returns jsPDF document.
 */
export function generateForm1099NecPdf(
  payee: Form1099PayeeData,
  payer: Form1099PayerProfile,
  taxYear: string = '2026'
): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const copies = [
    { title: 'Copy B — For Recipient', note: 'This is important tax information and is being furnished to the IRS.' },
    { title: 'Copy C — For Payer', note: 'For Payer’s Records: Retain this copy for your tax files.' },
  ];

  copies.forEach((copy, idx) => {
    if (idx > 0) doc.addPage('letter', 'landscape');

    // Form Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('FORM 1099-NEC', 50, 45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(taxYear, 370, 45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.text('Nonemployee Compensation', 50, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${copy.title} • ${copy.note}`, 50, 74);

    // Left Column: Payer & Recipient Identity Boxes
    const payerInfo = [payer.name, payer.address, `${payer.city}, ${payer.state} ${payer.zip}`, payer.phone].filter(Boolean).join('\n');
    drawFieldBox(doc, 50, 85, 340, 85, "PAYER'S name, address, and telephone number", payerInfo);

    drawFieldBox(doc, 50, 175, 170, 35, "PAYER'S TIN", payer.tin);
    drawFieldBox(doc, 220, 175, 170, 35, "RECIPIENT'S TIN", payee.tinPlain);

    const payeeInfo = [payee.legalName, payee.businessName, payee.address, `${payee.city}, ${payee.state} ${payee.zip}`].filter(Boolean).join('\n');
    drawFieldBox(doc, 50, 215, 340, 95, "RECIPIENT'S name, address, and ZIP code", payeeInfo);

    // Right Column: Monetary Compensation Boxes
    drawFieldBox(doc, 400, 85, 340, 50, '1 Nonemployee compensation', fmt(payee.box1Compensation));
    drawFieldBox(doc, 400, 140, 340, 45, '4 Federal income tax withheld', fmt(payee.box4FederalWithheld || 0));
    drawFieldBox(doc, 400, 190, 340, 40, '5 State tax withheld', '$0.00');
    drawFieldBox(doc, 400, 235, 170, 40, '6 State / Payer’s state no.', payer.state || 'PA');
    drawFieldBox(doc, 570, 235, 170, 40, '7 State income', fmt(payee.box1Compensation));

    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Department of the Treasury — Internal Revenue Service | Generated via TaxShield Ledger Compliance Engine', 50, 560);
  });

  return doc;
}
