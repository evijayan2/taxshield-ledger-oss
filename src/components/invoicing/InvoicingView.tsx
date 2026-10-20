import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  CreditCard, 
  CheckCircle2, 
  Check,
  Clock, 
  AlertCircle, 
  Building2, 
  Search,
  Filter,
  ExternalLink,
  Ban,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import type { Invoice, Customer, InvoiceStatus } from 'taxshield-ledger-core';
import { InvoiceDrawer } from './InvoiceDrawer';
import { CustomerDrawer } from './CustomerDrawer';
import { downloadInvoicePdf, CompanyBillingProfile } from '../../utils/invoicePdfGenerator';

interface InvoicingViewProps {
  invoices: Invoice[];
  customers: Customer[];
  company: CompanyBillingProfile;
  activeTaxYear: number;
  onCreateInvoice: (data: any) => void;
  onCreateCustomer: (customer: any) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

/**
 * Invoicing & Accounts Receivable management view with dual-theme glass styling.
 */
export function InvoicingView({
  invoices,
  customers,
  company,
  activeTaxYear,
  onCreateInvoice,
  onCreateCustomer,
  onUpdateInvoiceStatus,
  onDeleteInvoice,
}: InvoicingViewProps) {
  const [showInvoiceDrawer, setShowInvoiceDrawer] = useState(false);
  const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Metrics
  const totalBilled = (invoices || []).reduce((acc, inv) => acc + (inv?.status !== 'VOID' ? Number(inv?.totalAmount || 0) : 0), 0);
  const totalPaid = (invoices || []).filter((i) => i?.status === 'PAID').reduce((acc, i) => acc + Number(i?.amountPaid || 0), 0);
  const totalOutstanding = (invoices || [])
    .filter((i) => i?.status === 'SENT' || i?.status === 'VIEWED' || i?.status === 'OVERDUE')
    .reduce((acc, i) => acc + (Number(i?.totalAmount || 0) - Number(i?.amountPaid || 0)), 0);
  const overdueCount = (invoices || []).filter((i) => i?.status === 'OVERDUE').length;

  const filteredInvoices = (invoices || []).filter((inv) => {
    if (!inv) return false;
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = (inv.invoiceNumber || '').toLowerCase().includes(q);
      const matchCust = (inv.customerName || '').toLowerCase().includes(q);
      return matchNum || matchCust;
    }
    return true;
  });

  const handleDownloadPdf = (inv: Invoice) => {
    const itemKey = inv.id || inv.invoiceNumber || 'temp_inv';
    setDownloadingId(itemKey);
    setDownloadError(null);

    try {
      const cust = (customers || []).find((c) => c.id === inv.customerId);
      downloadInvoicePdf(inv, cust, company);
      setDownloadSuccessId(itemKey);
      setTimeout(() => {
        setDownloadSuccessId((current) => (current === itemKey ? null : current));
      }, 1800);
    } catch (err: any) {
      console.error('[InvoicingView] Failed to generate/download invoice PDF:', err);
      setDownloadError(err?.message || 'Unable to generate invoice PDF. Please check your browser popup/download settings.');
    } finally {
      setDownloadingId((current) => (current === itemKey ? null : current));
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">● PAID</span>;
      case 'SENT':
      case 'VIEWED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">● AWAITING PAYMENT</span>;
      case 'OVERDUE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">● OVERDUE</span>;
      case 'VOID':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">● VOID</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">● DRAFT</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-sky-500" />
            Invoicing & Client Billing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Issue itemized bills, collect ACH & Card payments via Stripe, and automate merchant fee accounting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomerDrawer(true)}
            className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            Clients ({customers.length})
          </button>
          <button
            onClick={() => setShowInvoiceDrawer(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{downloadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadError(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Billed ({activeTaxYear})</p>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">${Number(totalBilled || 0).toFixed(2)}</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Settled & Collected</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">${Number(totalPaid || 0).toFixed(2)}</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wider">Outstanding Receivable</p>
          <p className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1.5">${Number(totalOutstanding || 0).toFixed(2)}</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Overdue Bills</p>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1.5">{overdueCount}</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice # or client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === st
                  ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 font-bold border border-sky-300 dark:border-sky-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Issue Date</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3 text-right">Total Due</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No client invoices found. Click "New Invoice" to create your first bill.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id || inv.invoiceNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-sky-600 dark:text-sky-400">{inv.invoiceNumber || 'INV-DRAFT'}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{inv.customerName || (customers || []).find((c) => c.id === inv.customerId)?.name || 'Client'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{inv.issueDate || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{inv.dueDate || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">${Number(inv.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-center">{getStatusBadge(inv.status)}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPdf(inv);
                        }}
                        disabled={downloadingId === (inv.id || inv.invoiceNumber)}
                        title={downloadSuccessId === (inv.id || inv.invoiceNumber) ? 'Downloaded Successfully' : 'Download Vector PDF'}
                        className={`p-1.5 rounded transition-all duration-200 ${
                          downloadSuccessId === (inv.id || inv.invoiceNumber)
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 ring-1 ring-emerald-300 dark:ring-emerald-700'
                            : 'text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {downloadSuccessId === (inv.id || inv.invoiceNumber) ? (
                          <Check className="w-4 h-4 inline text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-150" />
                        ) : (
                          <Download className={`w-4 h-4 inline ${downloadingId === (inv.id || inv.invoiceNumber) ? 'animate-bounce text-sky-500' : ''}`} />
                        )}
                      </button>
                      {inv.status !== 'PAID' && inv.status !== 'VOID' && (
                        <button
                          onClick={() => onUpdateInvoiceStatus(inv.id || inv.invoiceNumber || 'INV-DRAFT', 'PAID')}
                          title="Mark as Paid"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <CheckCircle2 className="w-4 h-4 inline" />
                        </button>
                      )}
                      {inv.status !== 'VOID' && inv.status !== 'PAID' && (
                        <button
                          type="button"
                          onClick={() => onUpdateInvoiceStatus(inv.id || inv.invoiceNumber || 'INV-DRAFT', 'VOID')}
                          title="Void Invoice"
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Ban className="w-4 h-4 inline" />
                        </button>
                      )}
                      {onDeleteInvoice && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInvoiceToDelete(inv);
                          }}
                          title="Delete Invoice"
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawers */}
      <InvoiceDrawer
        isOpen={showInvoiceDrawer}
        onClose={() => setShowInvoiceDrawer(false)}
        customers={customers}
        activeTaxYear={activeTaxYear}
        onSaveInvoice={onCreateInvoice}
        onOpenNewCustomer={() => {
          setShowInvoiceDrawer(false);
          setShowCustomerDrawer(true);
        }}
      />

      <CustomerDrawer
        isOpen={showCustomerDrawer}
        onClose={() => setShowCustomerDrawer(false)}
        onSaveCustomer={onCreateCustomer}
      />

      {/* Custom In-App Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setInvoiceToDelete(null)}
          />

          {/* Dialog Panel */}
          <div className="relative glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Client Invoice?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to delete invoice <span className="font-mono font-bold text-slate-900 dark:text-white">{invoiceToDelete.invoiceNumber || 'INV-DRAFT'}</span>? This will permanently remove this bill and its line items from your accounts receivable ledger and record the event in the audit trail.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Client</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {invoiceToDelete.customerName || (customers || []).find((c) => c.id === invoiceToDelete.customerId)?.name || 'Client'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Total Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ${Number(invoiceToDelete.totalAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Status</span>
                <span>{getStatusBadge(invoiceToDelete.status)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteInvoice?.(invoiceToDelete.id || invoiceToDelete.invoiceNumber || 'INV-DRAFT');
                  setInvoiceToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
