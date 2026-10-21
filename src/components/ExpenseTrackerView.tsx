import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Tag, 
  Building2, 
  FileCheck, 
  Eye, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { GeneralExpense } from '../types';
import { getRecordYear, isFutureYear, isFutureDateString } from '../utils/taxEngine';
import { evaluateExpenseAudit, detectDuplicateExpenses } from 'taxshield-ledger-core';
import { ReceiptOcrScannerDrawer } from './ReceiptOcrScannerDrawer';
import { PerExpenseAuditBadge } from './audit/PerExpenseAuditBadge';

interface ExpenseTrackerViewProps {
  expenses: GeneralExpense[];
  activeTaxYear?: number;
  onAddExpense: (expense: Omit<GeneralExpense, 'id' | 'createdAt'>) => void;
  onDeleteExpense: (id: string) => void;
}

const SCHEDULE_C_CATEGORIES = [
  { line: 'Line 8 - Advertising', category: 'MARKETING' },
  { line: 'Line 10 - Commissions & Fees', category: 'BANK_FEES' },
  { line: 'Line 17 - Legal & Professional Services', category: 'LEGAL_ACCOUNTING' },
  { line: 'Line 18 - Office Expense', category: 'OFFICE_SUPPLIES' },
  { line: 'Line 20b - Rent/Lease (Other)', category: 'RENT_LEASE' },
  { line: 'Line 25 - Utilities / Phone / Internet', category: 'PHONE_INTERNET' },
  { line: 'Line 27a - Software & Technology Tools', category: 'SOFTWARE_TECH' },
  { line: 'Line 27a - Other Expenses', category: 'OTHER' },
];

/**
 * Modern Expense Tracker component with Schedule C mapping and receipt dropzone.
 */
export function ExpenseTrackerView({ expenses, activeTaxYear = 2026, onAddExpense, onDeleteExpense }: ExpenseTrackerViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOcrDrawer, setShowOcrDrawer] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  interface PendingClaim {
    id: string;
    employeeName: string;
    date: string;
    merchant: string;
    category: GeneralExpense['category'];
    scheduleCLine: string;
    amount: number;
    purpose: string;
    receiptUrl?: string;
  }

  // Pending Employee Accountable Plan Reimbursement Claims (starts fresh with 0 initial claims)
  const [pendingEmployeeClaims, setPendingEmployeeClaims] = useState<PendingClaim[]>([]);

  const handleApproveEmployeeClaim = (claim: typeof pendingEmployeeClaims[0]) => {
    onAddExpense({
      expenseDate: claim.date,
      payee: `${claim.merchant} (Reimbursed to ${claim.employeeName})`,
      category: claim.category,
      scheduleCLine: claim.scheduleCLine,
      description: `[Accountable Plan Reimbursement] Employee: ${claim.employeeName}. Purpose: ${claim.purpose}`,
      amount: claim.amount,
      paidBy: 'LLC_ACCOUNT',
      isTaxDeductible: true,
      receiptUrl: claim.receiptUrl,
    });
    setPendingEmployeeClaims(prev => prev.filter(c => c.id !== claim.id));
  };

  const handleRejectEmployeeClaim = (id: string) => {
    setPendingEmployeeClaims(prev => prev.filter(c => c.id !== id));
  };

  // Form State with year-aware default date
  const defaultDate = new Date().getFullYear() === activeTaxYear
    ? new Date().toISOString().split('T')[0]
    : `${activeTaxYear}-01-15`;
  const [expenseDate, setExpenseDate] = useState<string>(defaultDate);
  const [payee, setPayee] = useState('');
  const [category, setCategory] = useState<GeneralExpense['category']>('OFFICE_SUPPLIES');
  const [scheduleCLine, setScheduleCLine] = useState('Line 18 - Office Expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<'OWNER_PERSONAL' | 'LLC_ACCOUNT'>('LLC_ACCOUNT');
  const [isDeductible, setIsDeductible] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState('');

  const yearExpenses = expenses.filter(exp => getRecordYear(exp.expenseDate) === activeTaxYear);

  const isFutureActiveYear = isFutureYear(activeTaxYear);
  const isSelectedDateFuture = isFutureDateString(expenseDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payee || !amount || isNaN(Number(amount))) return;
    if (isFutureActiveYear || isSelectedDateFuture) return;

    onAddExpense({
      expenseDate,
      payee,
      category,
      scheduleCLine,
      description,
      amount: parseFloat(amount),
      paidBy,
      isTaxDeductible: isDeductible,
      receiptUrl: receiptUrl.trim() || undefined,
    });

    // Reset Form
    setPayee('');
    setDescription('');
    setAmount('');
    setReceiptUrl('');
    setShowAddModal(false);
  };

  const filteredExpenses = yearExpenses.filter(exp => {
    const matchesSearch = exp.payee.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'ALL' || exp.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const duplicateMatches = React.useMemo(() => {
    return detectDuplicateExpenses({ generalExpenses: yearExpenses });
  }, [yearExpenses]);

  const duplicateExpenseIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const d of duplicateMatches) {
      set.add(d.primary.id);
      set.add(d.duplicate.id);
    }
    return set;
  }, [duplicateMatches]);

  const totalDeductible = yearExpenses
    .filter(e => e.isTaxDeductible !== false)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 sm:p-6 rounded-2xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
            General Expenses & Receipts
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track business operating expenses mapped directly to IRS Schedule C lines.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => !isFutureActiveYear && setShowOcrDrawer(true)}
            disabled={isFutureActiveYear}
            title={isFutureActiveYear ? `Scanning receipts for future tax year (${activeTaxYear}) is locked` : 'Scan Receipt (OCR)'}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 font-medium rounded-xl text-xs sm:text-sm transition-all ${
              isFutureActiveYear
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Scan Receipt (OCR)
          </button>
          <button
            onClick={() => !isFutureActiveYear && setShowAddModal(true)}
            disabled={isFutureActiveYear}
            title={isFutureActiveYear ? `Adding expenses for future tax year (${activeTaxYear}) is locked` : 'Add Expense'}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 font-medium rounded-xl text-xs sm:text-sm transition-all ${
              isFutureActiveYear
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
            }`}
          >
            {isFutureActiveYear ? <Lock className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4" />}
            Add Expense
          </button>
        </div>
      </div>

      {/* Future Tax Year Warning Banner */}
      {isFutureActiveYear && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-medium flex items-center gap-3 shadow-sm">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold block text-sm">Future Tax Year Locked ({activeTaxYear})</span>
            <span>Adding expenses or financial entries for future tax years is disabled until tax year {activeTaxYear} begins.</span>
          </div>
        </div>
      )}

      {/* Pending Employee Accountable Plan Reimbursement Claims Banner */}
      {pendingEmployeeClaims.length > 0 && !isFutureActiveYear && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-slate-900/90 border border-emerald-500/40 text-slate-200 dark:text-slate-400 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Pending Employee Reimbursement Claims ({pendingEmployeeClaims.length})
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                IRS Accountable Plan
              </span>
            </div>
            <span className="text-xs text-emerald-300/80 font-mono">Requires Owner Approval</span>
          </div>

          <div className="space-y-2">
            {pendingEmployeeClaims.map((claim) => (
              <div key={claim.id} className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <span>{claim.employeeName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-300 font-mono">${claim.amount.toFixed(2)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-normal text-slate-300">{claim.merchant}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{claim.purpose}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApproveEmployeeClaim(claim)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Claim
                  </button>
                  <button
                    onClick={() => handleRejectEmployeeClaim(claim.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                    title="Decline Claim"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>Total Logged Expenses</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-2">
            ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">{expenses.length} transaction entries</span>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>Schedule C Tax Deductible</span>
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-2">
            ${totalDeductible.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 block font-medium">Reduces Taxable Business Profit</span>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>Receipt Attachment Rate</span>
            <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-2">
            {expenses.length > 0 ? Math.round((expenses.filter(e => e.receiptUrl).length / expenses.length) * 100) : 0}%
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block font-medium">Audit Proof Documentation</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search payee or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 glass-input rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="glass-input px-3 py-2 rounded-lg text-sm text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {SCHEDULE_C_CATEGORIES.map(c => (
              <option key={c.category} value={c.category}>{c.line}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Payee & Category</th>
                <th className="px-6 py-4">Schedule C Line</th>
                <th className="px-6 py-4">Paid By</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Audit Status & Receipt</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No business expenses recorded yet. Click "Add Expense" to log your first transaction.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{exp.expenseDate}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{exp.payee}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{exp.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {exp.scheduleCLine || 'Line 18 - Office Expense'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono ${
                        exp.paidBy === 'LLC_ACCOUNT'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30'
                      }`}>
                        <Building2 className="w-3 h-3" />
                        {exp.paidBy === 'LLC_ACCOUNT' ? 'Company Account' : 'Owner Personal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-mono">
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PerExpenseAuditBadge
                          auditDetail={evaluateExpenseAudit(exp, false, duplicateExpenseIds.has(exp.id))}
                          isDuplicate={duplicateExpenseIds.has(exp.id)}
                        />
                        {exp.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptUrl(exp.receiptUrl!)}
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        ) : (
                          <span className={`text-[11px] font-mono ${exp.amount >= 75 ? 'text-rose-500 font-semibold' : 'text-slate-400 italic'}`}>
                            {exp.amount >= 75 ? 'Receipt Req.' : 'No receipt'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Slide-Over Drawer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-lg w-full flex">
            <div className="w-full glass-panel bg-white/95 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Log New Business Expense
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full glass-input p-2.5 rounded-lg text-sm"
                    />
                    {isSelectedDateFuture && (
                      <p className="text-xs text-rose-500 font-semibold mt-1">
                        ⚠️ Future tax year dates are locked.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full glass-input p-2.5 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Payee / Vendor</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS, Staples, Home Depot"
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    className="w-full glass-input p-2.5 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Schedule C Line Mapping</label>
                  <select
                    value={scheduleCLine}
                    onChange={(e) => {
                      const selLine = e.target.value;
                      setScheduleCLine(selLine);
                      const matched = SCHEDULE_C_CATEGORIES.find(c => c.line === selLine);
                      if (matched) setCategory(matched.category as GeneralExpense['category']);
                    }}
                    className="w-full glass-input p-2.5 rounded-lg text-sm text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {SCHEDULE_C_CATEGORIES.map(c => (
                      <option key={c.line} value={c.line}>{c.line}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Description / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Cloud hosting for client production environment"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full glass-input p-2.5 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Payment Method</label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value as 'OWNER_PERSONAL' | 'LLC_ACCOUNT')}
                      className="w-full glass-input p-2.5 rounded-lg text-sm text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="LLC_ACCOUNT">Company Account</option>
                      <option value="OWNER_PERSONAL">Owner Personal (Reimbursable)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Receipt URL / Image Link</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={receiptUrl}
                      onChange={(e) => setReceiptUrl(e.target.value)}
                      className="w-full glass-input p-2.5 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="deductibleCheck"
                    checked={isDeductible}
                    onChange={(e) => setIsDeductible(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="deductibleCheck" className="text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    Tax Deductible Business Expense
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isFutureActiveYear || isSelectedDateFuture}
                    className={`px-5 py-2 text-sm font-medium rounded-lg shadow ${
                      isFutureActiveYear || isSelectedDateFuture
                        ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    }`}
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receipt OCR Scanner Slide-Over Drawer */}
      <ReceiptOcrScannerDrawer
        isOpen={showOcrDrawer}
        onClose={() => setShowOcrDrawer(false)}
        onConfirmExpense={onAddExpense}
        activeTaxYear={activeTaxYear}
      />

      {/* Receipt Image Modal */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setSelectedReceiptUrl(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xl w-full flex">
            <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-semibold text-slate-900 dark:text-white">Receipt Document</h4>
                <button onClick={() => setSelectedReceiptUrl(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm cursor-pointer">Close</button>
              </div>
              <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-lg flex items-center justify-center flex-1">
                <img src={selectedReceiptUrl} alt="Receipt Preview" className="max-h-[500px] object-contain rounded" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
