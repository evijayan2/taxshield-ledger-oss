import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Check, X, FileText, Info } from 'lucide-react';
import { ExpenseAuditDetail } from '../../types';

interface PerExpenseAuditBadgeProps {
  auditDetail?: ExpenseAuditDetail;
  isDuplicate?: boolean;
  onOpenDuplicateDrawer?: () => void;
}

/**
 * Compact micro-indicator showing IRS audit readiness score and compliance checklist.
 */
export function PerExpenseAuditBadge({
  auditDetail,
  isDuplicate = false,
  onOpenDuplicateDrawer,
}: PerExpenseAuditBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!auditDetail) {
    return null;
  }

  const { score, checks, hasReceipt, hasPurpose, isBankReconciled } = auditDetail;

  const scoreBadgeClass =
    score >= 90
      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
      : score >= 75
      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400';

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Score Pill */}
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border flex items-center gap-1 cursor-pointer transition-all ${scoreBadgeClass}`}
      >
        {score >= 90 ? (
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        )}
        <span>{score}% Ready</span>
      </div>

      {/* Duplicate Warning Pill */}
      {isDuplicate && (
        <button
          type="button"
          onClick={onOpenDuplicateDrawer}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-1 hover:bg-rose-200 cursor-pointer animate-pulse"
          title="Suspected duplicate expense detected. Click to inspect."
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>DUPE</span>
        </button>
      )}

      {/* Floating Tooltip Checklist */}
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-64 p-3 rounded-xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-2 pointer-events-none animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5 font-bold text-slate-800 dark:text-slate-100">
            <span>IRS Audit Readiness</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">{score}/100</span>
          </div>

          <div className="space-y-1.5">
            {checks.map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px]">
                {c.passed ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <span className={c.passed ? 'text-slate-600 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                  {c.checkName}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Documented proof protects deductions.</span>
          </div>
        </div>
      )}
    </div>
  );
}
