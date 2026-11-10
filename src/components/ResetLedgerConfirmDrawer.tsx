import React, { useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  RotateCcw, 
  ShieldCheck, 
  Receipt, 
  Car, 
  DollarSign, 
  FileText, 
  Landmark, 
  Building2, 
  Loader2 
} from 'lucide-react';

interface ResetLedgerConfirmDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isResetting?: boolean;
  companyName?: string;
  counts?: {
    expenses?: number;
    mileage?: number;
    travel?: number;
    payroll?: number;
    invoices?: number;
    bankTx?: number;
  };
}

/**
 * Slide-over confirmation drawer for resetting all transactional ledger data.
 * Complies with AGENTS.md UI Rule 5 (Slide-over Drawers) and Rule 6 (No browser native dialogs).
 */
export function ResetLedgerConfirmDrawer({
  isOpen,
  onClose,
  onConfirm,
  isResetting = false,
  companyName,
  counts = {},
}: ResetLedgerConfirmDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isResetting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isResetting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="reset-drawer-title">
      {/* Dark backdrop overlay with blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => !isResetting && onClose()}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800/50 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 id="reset-drawer-title" className="text-base font-bold text-slate-900 dark:text-white">
                Reset Financial Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {companyName || 'Micro-LLC Ledger'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            aria-label="Close drawer"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto text-xs">
          {/* Warning Banner */}
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-xs text-rose-800 dark:text-rose-300">
                This action resets transactional data to zero.
              </p>
              <p className="text-rose-700 dark:text-rose-400 text-xs leading-relaxed">
                All operating expenses, mileage logs, travel reimbursements, payroll runs, invoices, and bank transaction batches will be removed from this company.
              </p>
            </div>
          </div>

          {/* Records To Be Reset */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Records To Be Cleared</span>
              <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px] font-semibold">Will Reset to 0</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-rose-500" />
                  <span>Operating Expenses & Receipts</span>
                </span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">
                  {counts.expenses ?? 'All'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-rose-500" />
                  <span>IRS Mileage & Travel Logs</span>
                </span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">
                  {(counts.mileage || 0) + (counts.travel || 0) || 'All'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                  <span>Payroll Runs & Pay Stubs</span>
                </span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">
                  {counts.payroll ?? 'All'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>Invoices & Contractor Payments</span>
                </span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">
                  {counts.invoices ?? 'All'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-rose-500" />
                  <span>Bank Import Batches & Feeds</span>
                </span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">
                  {counts.bankTx ?? 'All'}
                </span>
              </div>
            </div>
          </div>

          {/* Records Kept Safe */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Kept Safe & Preserved</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold">Preserved</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Company Entity Profile, Name & EIN</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Statutory Tax Rules & Jurisdiction Tables</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Active Tax Year Configuration & User Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isResetting}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-2 cursor-pointer shadow-md shadow-rose-700/20 disabled:opacity-50"
          >
            {isResetting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Resetting Ledger...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm & Reset All Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

