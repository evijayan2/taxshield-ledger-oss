import React, { useState } from 'react';
import { X, DollarSign, Calendar, Check, CreditCard, FileText } from 'lucide-react';

interface ContractorPaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contractors: Array<{ id: string; name: string }>;
  activeTaxYear: number;
  onRecordPayment: (payment: {
    employeeId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    description?: string;
  }) => void;
}

/**
 * Slide-over drawer for logging disbursements to independent contractors.
 */
export function ContractorPaymentDrawer({
  isOpen,
  onClose,
  contractors,
  activeTaxYear,
  onRecordPayment,
}: ContractorPaymentDrawerProps) {
  const [employeeId, setEmployeeId] = useState(contractors[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('ACH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!employeeId) {
      setError('Please select a contractor');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than $0.00');
      return;
    }

    onRecordPayment({
      employeeId,
      amount: numAmount,
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-md animate-in slide-in-from-right duration-300">
          <div className="flex h-full flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Log Contractor Payment</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tax Year {activeTaxYear} • 1099-NEC Threshold Tracking</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Contractor *</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Disbursement Amount ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="750.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ACH">ACH Transfer</option>
                    <option value="CHECK">Paper Check</option>
                    <option value="WIRE">Wire Transfer</option>
                    <option value="DEBIT">Debit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Check / Reference #</label>
                <input
                  type="text"
                  placeholder="e.g. Check #1042 or Mercury Trace"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Deliverables Memo</label>
                <textarea
                  rows={2}
                  placeholder="Website UI redesign milestone 1..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

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
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Record Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
