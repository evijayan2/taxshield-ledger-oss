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
  Lock
} from 'lucide-react';
import { GeneralExpense } from '../types';
import { getRecordYear, isFutureYear, isFutureDateString } from '../utils/taxEngine';

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
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

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

  const totalDeductible = yearExpenses
    .filter(e => e.isTaxDeductible !== false)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            General Expenses & Receipts
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track business operating expenses mapped directly to IRS Schedule C lines.
          </p>
        </div>
        <button
          onClick={() => !isFutureActiveYear && setShowAddModal(true)}
          disabled={isFutureActiveYear}
          title={isFutureActiveYear ? `Adding expenses for future tax year (${activeTaxYear}) is locked` : 'Add Expense'}
          className={`flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl transition-all ${
            isFutureActiveYear
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 cursor-pointer'
          }`}
        >
          {isFutureActiveYear ? <Lock className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4" />}
          Add Expense
        </button>
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>Total Logged Expenses</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">{expenses.length} transaction entries</span>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>Schedule C Tax Deductible</span>
            <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            ${totalDeductible.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 block font-medium">Reduces Taxable LLC Profit</span>
        </div>

        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>Receipt Attachment Rate</span>
            <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {expenses.length > 0 ? Math.round((expenses.filter(e => e.receiptUrl).length / expenses.length) * 100) : 0}%
          </p>
          <span className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 block font-medium">Audit Proof Documentation</span>
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
                <th className="px-6 py-4">Receipt</th>
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
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
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
                        {exp.paidBy === 'LLC_ACCOUNT' ? 'LLC Account' : 'Owner Personal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {exp.receiptUrl ? (
                        <button
                          onClick={() => setSelectedReceiptUrl(exp.receiptUrl!)}
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No receipt</span>
                      )}
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

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-lg w-full flex">
            <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Log New Business Expense
              </h3>

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
                      className="w-full glass-input p-2.5 rounded-lg text-sm"
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
                      <option value="LLC_ACCOUNT">LLC Business Account</option>
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
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
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
