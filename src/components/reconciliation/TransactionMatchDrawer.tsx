import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  PlusCircle,
  ArrowRightLeft,
  Calendar,
  Building2,
  DollarSign,
  Tag,
} from 'lucide-react';
import type { BankTransaction, CandidateMatch } from 'taxshield-ledger-core';

interface TransactionMatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: BankTransaction | null;
  candidates: CandidateMatch[];
  onConfirmMatch: (bankTxId: string, entityType: string, entityId: string, notes?: string) => Promise<void> | void;
  onConvertExpense: (bankTxId: string, expenseData: {
    category: 'LEGAL_ACCOUNTING' | 'SOFTWARE_TECH' | 'OFFICE_SUPPLIES' | 'PHONE_INTERNET' | 'BANK_FEES' | 'MARKETING' | 'UTILITIES' | 'RENT_LEASE' | 'OTHER';
    description: string;
    scheduleCLine: string;
    isTaxDeductible: boolean;
  }) => Promise<void> | void;
  onIgnoreTransfer: (bankTxId: string) => Promise<void> | void;
}

const CATEGORY_LINE_MAP: Record<string, { line: string; label: string }> = {
  SOFTWARE_TECH: { line: '27a', label: 'Software & Cloud Services (Line 27a)' },
  OFFICE_SUPPLIES: { line: '18', label: 'Office Supplies & Materials (Line 18)' },
  LEGAL_ACCOUNTING: { line: '17', label: 'Legal & Professional Services (Line 17)' },
  PHONE_INTERNET: { line: '25', label: 'Utilities / Phone & Internet (Line 25)' },
  BANK_FEES: { line: '10', label: 'Commissions & Merchant Fees (Line 10)' },
  MARKETING: { line: '8', label: 'Advertising & Marketing (Line 8)' },
  UTILITIES: { line: '25', label: 'Utilities (Line 25)' },
  RENT_LEASE: { line: '20b', label: 'Rent / Lease (Line 20b)' },
  OTHER: { line: '27a', label: 'Other Business Expenses (Line 27a)' },
};

export function TransactionMatchDrawer({
  isOpen,
  onClose,
  transaction,
  candidates,
  onConfirmMatch,
  onConvertExpense,
  onIgnoreTransfer,
}: TransactionMatchDrawerProps) {
  if (!isOpen || !transaction) return null;

  // Auto-suggest category based on payee keywords
  const suggestCategory = (payee: string) => {
    const p = payee.toLowerCase();
    if (/aws|amazon web|github|figma|google|slack|stripe|vercel|openai|anthropic|cloudflare|zoom/i.test(p)) {
      return 'SOFTWARE_TECH';
    }
    if (/staples|officedepot|paper|hardware|target|walmart/i.test(p)) {
      return 'OFFICE_SUPPLIES';
    }
    if (/att|verizon|t-mobile|comcast|spectrum/i.test(p)) {
      return 'PHONE_INTERNET';
    }
    if (/fee|service fee|wire fee|monthly service/i.test(p)) {
      return 'BANK_FEES';
    }
    if (/meta|facebook|google ads|linkedin ads/i.test(p)) {
      return 'MARKETING';
    }
    return 'OTHER';
  };

  const initialCat = suggestCategory(transaction.cleanPayee);
  const [selectedCategory, setSelectedCategory] = useState<any>(initialCat);
  const [description, setDescription] = useState(transaction.cleanPayee);
  const [isDeductible, setIsDeductible] = useState(true);
  const [activeTab, setActiveTab] = useState<'MATCH' | 'CREATE_EXPENSE'>('MATCH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmCandidate = async (candidate: CandidateMatch) => {
    setIsSubmitting(true);
    try {
      await onConfirmMatch(
        transaction.id,
        candidate.entityType,
        candidate.entityId,
        candidate.matchReasons.join('; ')
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConvertExpense(transaction.id, {
        category: selectedCategory,
        description: description || transaction.cleanPayee,
        scheduleCLine: CATEGORY_LINE_MAP[selectedCategory]?.line || '27a',
        isTaxDeductible: isDeductible,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIgnore = async () => {
    setIsSubmitting(true);
    try {
      await onIgnoreTransfer(transaction.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex pl-10">
        <div className="w-full glass-panel shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Reconciliation Review
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Verify candidate match or convert unmatched debit to verified expense.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Bank Transaction Card */}
            <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Bank Statement Transaction
                </span>
                <span
                  className={
                    transaction.reconciliationStatus === 'MATCHED'
                      ? 'badge-emerald'
                      : transaction.reconciliationStatus === 'NEEDS_REVIEW'
                      ? 'badge-amber'
                      : transaction.reconciliationStatus === 'DUPLICATE'
                      ? 'badge-slate'
                      : 'badge-rose'
                  }
                >
                  {transaction.reconciliationStatus.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {transaction.cleanPayee}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {transaction.postedDate} • {transaction.rawDescription}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-2xl font-bold font-mono ${
                      transaction.transactionType === 'DEBIT'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {transaction.transactionType === 'DEBIT' ? '-' : '+'}$
                    {transaction.amount.toFixed(2)}
                  </span>
                  <p className="text-[11px] text-slate-400 uppercase font-medium">
                    {transaction.transactionType}
                  </p>
                </div>
              </div>

              {transaction.matchNotes && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{transaction.matchNotes}</span>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('MATCH')}
                className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'MATCH'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Candidate Matches ({candidates.length})
              </button>
              {transaction.transactionType === 'DEBIT' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('CREATE_EXPENSE')}
                  className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === 'CREATE_EXPENSE'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Record as New Expense
                </button>
              )}
            </div>

            {/* Tab 1: Candidate Matches */}
            {activeTab === 'MATCH' && (
              <div className="space-y-4">
                {candidates.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No matching records found in ledger
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      No existing expense, invoice, or payroll run matches this amount and date window.
                      You can record it as a new deductible expense below.
                    </p>
                    {transaction.transactionType === 'DEBIT' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('CREATE_EXPENSE')}
                        className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Record as New Expense
                      </button>
                    )}
                  </div>
                ) : (
                  candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="badge-emerald font-semibold">
                              {Math.round(cand.confidenceScore * 100)}% Match
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                              {cand.entityType.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {cand.label}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            Ledger Date: {cand.date} • Amount: ${cand.amount.toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleConfirmCandidate(cand)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirm Match
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                        {cand.matchReasons.map((reason, rIdx) => (
                          <span
                            key={rIdx}
                            className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            ✓ {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}

                {/* Ignore / Transfer action */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleIgnore}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                    Mark as Owner Transfer / Personal (Ignore for Taxes)
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Record as New Expense */}
            {activeTab === 'CREATE_EXPENSE' && (
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expense Description / Payee
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Schedule C Tax Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm rounded-lg"
                  >
                    {Object.entries(CATEGORY_LINE_MAP).map(([key, val]) => (
                      <option key={key} value={key} className="dark:bg-slate-900">
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Tax Deductible Business Expense
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Include on IRS Form 1040 Schedule C
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDeductible}
                    onChange={(e) => setIsDeductible(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Recording Expense...' : `Record Expense ($${transaction.amount.toFixed(2)}) & Reconcile`}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
