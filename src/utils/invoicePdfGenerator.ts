import jsPDF from 'jspdf';
import type { Invoice, Customer } from 'taxshield-ledger-core';

export interface CompanyBillingProfile {
  name: string;
  ein?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  ownerEmail?: string;
}

/**
 * Formats a numeric value into USD currency format (e.g. $1,234.56) safely.
 * @param val Dollar amount or unparsed string.
 * @returns Formatted USD string.
 */
function fmtCurr(val: number | string | undefined | null): string {
  const num = Number(val || 0);
  const safeNum = Number.isFinite(num) ? num : 0;
  return `$${safeNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Draws the top invoice branding header and metadata block.
 * @param doc jsPDF instance.
 * @param inv Invoice record.
 * @param comp Company profile.
 */
function drawInvoiceHeader(doc: jsPDF, inv: Invoice, comp?: CompanyBillingProfile): void {
  // Top Banner / Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(String(comp?.name || 'COMMERCIAL INVOICE'), 40, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const compAddr = [comp?.address, `${comp?.city || ''}, ${comp?.state || ''} ${comp?.zip || ''}`.trim()].filter(Boolean).join(' • ');
  if (compAddr) doc.text(compAddr, 40, 65);
  if (comp?.ein) doc.text(`EIN: ${comp.ein}`, 40, 78);

  // Invoice Meta Block (Right Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(14, 165, 233); // sky-500
  doc.text(String(inv?.invoiceNumber || 'INV-DRAFT'), 572, 50, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Issue Date: ${inv?.issueDate || new Date().toISOString().split('T')[0]}`, 572, 65, { align: 'right' });
  doc.text(`Due Date: ${inv?.dueDate || 'Upon Receipt'}`, 572, 78, { align: 'right' });
  doc.text(`Status: ${inv?.status || 'DRAFT'}`, 572, 91, { align: 'right' });
}

/**
 * Draws the bill-to customer details card.
 * @param doc jsPDF instance.
 * @param cust Customer details.
 * @param startY Vertical starting position.
 * @param inv Optional invoice for customer fallback name.
 */
function drawCustomerBlock(doc: jsPDF, cust: Customer | undefined, startY: number, inv?: Invoice): void {
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(40, startY, 532, 60, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO:', 52, startY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(String(cust?.name || inv?.customerName || 'Valued Client'), 52, startY + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const custAddr = [cust?.address, `${cust?.city || ''}, ${cust?.state || ''} ${cust?.zipCode || ''}`.trim(), cust?.email].filter(Boolean).join(' • ');
  doc.text(custAddr || 'No address on file', 52, startY + 46);
}

/**
 * Draws the table of itemized services and products.
 * @param doc jsPDF instance.
 * @param inv Invoice record.
 * @param startY Vertical start position.
 * @returns Ending Y coordinate after table rows.
 */
function drawLineItemsTable(doc: jsPDF, inv: Invoice, startY: number): number {
  let y = startY;

  // Header
  doc.setFillColor(241, 245, 249);
  doc.rect(40, y, 532, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION', 50, y + 14);
  doc.text('QTY', 360, y + 14, { align: 'right' });
  doc.text('UNIT PRICE', 450, y + 14, { align: 'right' });
  doc.text('AMOUNT', 560, y + 14, { align: 'right' });

  y += 22;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const rawItems = Array.isArray(inv?.lineItems) && inv.lineItems.length > 0
    ? inv.lineItems
    : [{ description: 'Professional Services', quantity: 1, unitPrice: Number(inv?.subtotal || inv?.totalAmount || 0), amount: Number(inv?.subtotal || inv?.totalAmount || 0) }];

  rawItems.forEach((item) => {
    const qty = Number(item?.quantity || 1);
    const unitPrice = Number(item?.unitPrice || 0);
    const amount = Number(item?.amount !== undefined && item?.amount !== null ? item.amount : qty * unitPrice);

    doc.text(String(item?.description || 'Service Item'), 50, y + 16);
    doc.text(qty.toString(), 360, y + 16, { align: 'right' });
    doc.text(fmtCurr(unitPrice), 450, y + 16, { align: 'right' });
    doc.text(fmtCurr(amount), 560, y + 16, { align: 'right' });

    doc.setDrawColor(241, 245, 249);
    doc.line(40, y + 24, 572, y + 24);
    y += 24;
  });

  return y;
}

/**
 * Draws subtotal, tax, and total summary box.
 * @param doc jsPDF instance.
 * @param inv Invoice record.
 * @param startY Vertical position.
 */
function drawTotalsBlock(doc: jsPDF, inv: Invoice, startY: number): void {
  const rightX = 560;
  const labelX = 450;
  let y = startY + 15;

  const subtotal = Number(inv?.subtotal !== undefined && inv?.subtotal !== null ? inv.subtotal : (Number(inv?.totalAmount || 0) - Number(inv?.taxAmount || 0)));
  const taxAmount = Number(inv?.taxAmount || 0);
  const totalAmount = Number(inv?.totalAmount !== undefined && inv?.totalAmount !== null ? inv.totalAmount : subtotal + taxAmount);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', labelX, y, { align: 'right' });
  doc.text(fmtCurr(subtotal), rightX, y, { align: 'right' });

  if (taxAmount > 0) {
    y += 16;
    doc.text('Sales Tax:', labelX, y, { align: 'right' });
    doc.text(fmtCurr(taxAmount), rightX, y, { align: 'right' });
  }

  y += 18;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(380, y - 12, 192, 28, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Due:', labelX, y + 6, { align: 'right' });
  doc.setTextColor(14, 165, 233);
  doc.text(fmtCurr(totalAmount), rightX, y + 6, { align: 'right' });
}

/**
 * Generates an official vector PDF invoice in browser or Node.
 * @param invoice Invoice data.
 * @param customer Optional customer details.
 * @param company Company billing identity.
 * @returns jsPDF document object.
 */
export function generateInvoicePdf(
  invoice: Invoice,
  customer?: Customer,
  company?: CompanyBillingProfile
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const invNumber = invoice?.invoiceNumber || 'INV-DRAFT';
  const custName = customer?.name || invoice?.customerName || 'Client';

  doc.setProperties({
    title: `Invoice ${invNumber} - ${custName}`,
    subject: `Commercial Invoice for ${custName}`,
    creator: 'TaxShield Ledger Commercial Engine',
  });

  drawInvoiceHeader(doc, invoice, company || { name: 'Commercial Invoice' });
  drawCustomerBlock(doc, customer, 110, invoice);
  const tableEndY = drawLineItemsTable(doc, invoice, 185);
  drawTotalsBlock(doc, invoice, tableEndY);

  // Footer notes & payment info
  if (invoice?.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Notes: ${invoice.notes}`, 40, 720);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for your business! Generated securely via TaxShield Ledger.', 40, 750);

  return doc;
}

/**
 * Safely generates and triggers the download of an official vector PDF invoice in browser.
 * @param invoice Invoice data.
 * @param customer Optional customer details.
 * @param company Company billing identity.
 * @returns Generated jsPDF document.
 */
export function downloadInvoicePdf(
  invoice: Invoice,
  customer?: Customer,
  company?: CompanyBillingProfile
): jsPDF {
  const doc = generateInvoicePdf(invoice, customer, company);
  const safeNum = String(invoice?.invoiceNumber || 'INV-DRAFT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeCust = String(customer?.name || invoice?.customerName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeNum}_${safeCust}.pdf`;

  try {
    doc.save(filename);
  } catch (saveErr) {
    console.warn('[InvoicePDF] doc.save fallback to Blob trigger:', saveErr);
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 250);
    }
  }

  return doc;
}

