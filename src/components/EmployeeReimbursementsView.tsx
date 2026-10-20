import React, { useState } from 'react';
import { 
  Receipt, 
  Car, 
  Plus, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  DollarSign,
  X,
  Upload
} from 'lucide-react';
import { User, Employee, GeneralExpense, MileageLog } from '../types';

interface EmployeeReimbursementsViewProps {
  user: User | null;
  employee: Employee | null;
  expenses?: GeneralExpense[];
  mileageLogs?: MileageLog[];
  activeTaxYear: number;
  isReadOnly?: boolean;
  onAddExpense?: (expense: Partial<GeneralExpense>) => void;
  onAddMileage?: (mileage: Partial<MileageLog>) => void;
}

interface ReimbursementClaim {
  id: string;
  type: 'EXPENSE' | 'MILEAGE';
  date: string;
  title: string;
  category: string;
  amount: number;
  businessPurpose: string;
  receiptAttached: boolean;
  status: 'PENDING' | 'APPROVED' | 'REIMBURSED' | 'REJECTED';
}

export function EmployeeReimbursementsView({
  user,
  employee,
  expenses = [],
  mileageLogs = [],
  activeTaxYear,
  isReadOnly = false,
  onAddExpense,
  onAddMileage,
}: EmployeeReimbursementsViewProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [claimType, setClaimType] = useState<'EXPENSE' | 'MILEAGE'>('EXPENSE');
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Office Supplies');
  const [amount, setAmount] = useState('');
  const [miles, setMiles] = useState('');
  const [purpose, setPurpose] = useState('');
  const [receiptName, setReceiptName] = useState<string | null>(null);

  // Start fresh with 0 initial reimbursement claims (populated strictly via user/employee input)
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);

  const totalReimbursed = claims
    .filter(c => c.status === 'REIMBURSED' || c.status === 'APPROVED')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingAmount = claims
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0);

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!amount && !miles) || !purpose) return;

    const calcAmount = claimType === 'EXPENSE' ? parseFloat(amount) || 0 : (parseFloat(miles) || 0) * 0.67;

    const newClaim: ReimbursementClaim = {
      id: `clm_${Date.now()}`,
      type: claimType,
      date,
      title,
      category: claimType === 'EXPENSE' ? category : 'Mileage Travel',
      amount: calcAmount,
      businessPurpose: purpose,
      receiptAttached: Boolean(receiptName),
      status: 'PENDING',
    };

    setClaims([newClaim, ...claims]);
    if (claimType === 'EXPENSE' && onAddExpense) {
      onAddExpense({
        expenseDate: date,
        payee: title,
        amount: calcAmount,
        category: (category as GeneralExpense['category']) || 'OTHER',
        notes: `[Accountable Plan Employee Reimbursement Claim] Purpose: ${purpose}`,
      });
    }

    // Reset Form
    setTitle('');
    setAmount('');
    setMiles('');
    setPurpose('');
    setReceiptName(null);
    setShowDrawer(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Expense & Mileage Claims</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
              IRS Accountable Plan
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Submit out-of-pocket business expenses and mileage logs for non-taxable payroll reimbursement.
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Reimbursement Claim
          </button>
        )}
      </div>

      {/* Accountable Plan Notice */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 dark:text-white">Non-Taxable Accountable Plan Protection: </span>
          Reimbursements processed with documented business purposes and receipts are exempt from federal income and FICA tax withholding per IRS rules.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approved & Reimbursed YTD</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">${totalReimbursed.toFixed(2)}</p>
        </div>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Owner Review</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">${pendingAmount.toFixed(2)}</p>
        </div>
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Claims Logged</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{claims.length}</p>
        </div>
      </div>

      {/* Claims Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-500" />
          My Reimbursement Claims ({activeTaxYear})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">Date</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Description & Category</th>
                <th className="pb-3">Business Purpose</th>
                <th className="pb-3 text-right">Amount</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-mono text-slate-500">{claim.date}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                      claim.type === 'EXPENSE'
                        ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                        : 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400'
                    }`}>
                      {claim.type === 'EXPENSE' ? <Receipt className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                      {claim.type}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="font-bold text-slate-900 dark:text-white">{claim.title}</div>
                    <div className="text-[10px] text-slate-500">{claim.category}</div>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{claim.businessPurpose}</td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900 dark:text-white">${claim.amount.toFixed(2)}</td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      claim.status === 'APPROVED' || claim.status === 'REIMBURSED'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : claim.status === 'PENDING'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                    }`}>
                      {claim.status === 'APPROVED' || claim.status === 'REIMBURSED' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : claim.status === 'PENDING' ? (
                        <Clock className="w-3 h-3 text-amber-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-500" />
                      )}
                      {claim.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Drawer for New Claim Submission */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Submit Reimbursement Claim</h3>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleSubmitClaim} className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Claim Type Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setClaimType('EXPENSE')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    claimType === 'EXPENSE'
                      ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Receipt className="w-4 h-4" /> Out-of-Pocket Expense
                </button>
                <button
                  type="button"
                  onClick={() => setClaimType('MILEAGE')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    claimType === 'MILEAGE'
                      ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Car className="w-4 h-4" /> Business Mileage
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {claimType === 'EXPENSE' ? 'Merchant / Description' : 'Trip Title / Destination'}
                </label>
                <input
                  type="text"
                  placeholder={claimType === 'EXPENSE' ? 'e.g. Office Depot Supplies' : 'e.g. Client Onsite Visit - Lancaster'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {claimType === 'EXPENSE' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Meals & Entertainment">Meals & Entertainment</option>
                      <option value="Travel & Lodging">Travel & Lodging</option>
                      <option value="Software & Subscriptions">Software & Subscriptions</option>
                      <option value="Other Business Expense">Other Business Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Miles Driven</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 45.5"
                    value={miles}
                    onChange={(e) => setMiles(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                  {miles && (
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      Calculated IRS Mileage Claim: ${(parseFloat(miles) * 0.67).toFixed(2)} (at $0.67/mi standard rate)
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Business Purpose (IRS Substantiation)</label>
                <textarea
                  rows={3}
                  placeholder="Explain how this expense directly relates to company operations..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Receipt Attachment</label>
                <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">
                    {receiptName ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{receiptName}</span>
                    ) : (
                      'Click to attach receipt image or PDF'
                    )}
                  </p>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && setReceiptName(e.target.files[0].name)}
                    className="hidden"
                    id="receipt-file-input"
                  />
                  <label
                    htmlFor="receipt-file-input"
                    className="mt-2 inline-block px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-md cursor-pointer hover:bg-slate-300"
                  >
                    Select File
                  </label>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  Submit Reimbursement Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
