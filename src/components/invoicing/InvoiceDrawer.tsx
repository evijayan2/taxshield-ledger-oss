import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, DollarSign, FileText, Check, Building2 } from 'lucide-react';
import type { Customer } from 'taxshield-ledger-core';
import type { PaymentTerms } from 'taxshield-ledger-core';

export interface InvoiceDrawerLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  activeTaxYear: number;
  onSaveInvoice: (data: {
    customerId: string;
    issueDate: string;
    paymentTerms: PaymentTerms;
    dueDate?: string;
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
    taxAmount: number;
    notes?: string;
  }) => void;
  onOpenNewCustomer: () => void;
}

/**
 * Slide-over drawer for creating customer invoices.
 */
export function InvoiceDrawer({
  isOpen,
  onClose,
  customers,
  activeTaxYear,
  onSaveInvoice,
  onOpenNewCustomer,
}: InvoiceDrawerProps) {
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('NET_30');
  const [notes, setNotes] = useState('Payment via ACH or Card. Net 30 terms.');
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [lineItems, setLineItems] = useState<InvoiceDrawerLineItem[]>([
    { id: '1', description: 'Consulting & Engineering Services', quantity: 1, unitPrice: 2500 },
  ]);

  React.useEffect(() => {
    if (!customerId && customers.length > 0) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'description' | 'quantity' | 'unitPrice', val: string | number) => {
    setLineItems(lineItems.map((item) => {
      if (item.id !== id) return item;
      return { ...item, [field]: val };
    }));
  };

  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
  const total = subtotal + Number(taxAmount || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select or create a client');
      return;
    }
    if (lineItems.some((item) => !item.description.trim() || item.unitPrice <= 0)) {
      setError('All line items must have a description and unit price greater than $0');
      return;
    }

    onSaveInvoice({
      customerId,
      issueDate,
      paymentTerms,
      lineItems: lineItems.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
      taxAmount: Number(taxAmount || 0),
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl animate-in slide-in-from-right duration-300">
          <div className="flex h-full flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Client Invoice</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tax Year {activeTaxYear} • Sequential Auto-Numbering</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  {error}
                </div>
              )}

              {/* Client Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Client / Customer *</label>
                  <button
                    type="button"
                    onClick={onOpenNewCustomer}
                    className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add New Client
                  </button>
                </div>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="" disabled>Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              {/* Dates & Payment Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                    <option value="NET_15">Net 15 Days</option>
                    <option value="NET_30">Net 30 Days</option>
                    <option value="NET_60">Net 60 Days</option>
                  </select>
                </div>
              </div>

              {/* Itemized Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Itemized Services & Deliverables</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        placeholder="Service description..."
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-2 text-sm text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-right"
                        />
                      </div>
                      <span className="w-20 text-sm font-mono font-medium text-right text-slate-700 dark:text-slate-300">
                        ${((Number(item.quantity || 0) * Number(item.unitPrice || 0))).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={lineItems.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal & Totals Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">${Number(subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                  <span>Sales Tax:</span>
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1 text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-5 pr-2 py-1 text-xs text-right rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>Total Amount Due:</span>
                  <span className="font-mono text-lg text-sky-600 dark:text-sky-400">${Number(total || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Notes & Wire/Payment Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
