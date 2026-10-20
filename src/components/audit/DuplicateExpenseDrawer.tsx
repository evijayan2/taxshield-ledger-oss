import React from 'react';
import {
  X,
  AlertTriangle,
  Copy,
  Calendar,
  DollarSign,
  Building2,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  FileText
} from 'lucide-react';
import { DuplicateExpenseMatch } from '../../types';

interface DuplicateExpenseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  duplicate: DuplicateExpenseMatch | null;
  onKeepBoth: (matchId: string) => void;
  onDeleteCandidate: (candidateId: string, entityType: string) => void;
}

/**
 * Slide-over drawer providing side-by-side comparison of suspected duplicate transactions.
 * Complies with AGENTS.md: Never auto-deletes; requires explicit user resolution.
 */
export function DuplicateExpenseDrawer({
  isOpen,
  onClose,
  duplicate,
  onKeepBoth,
  onDeleteCandidate,
}: DuplicateExpenseDrawerProps) {
  if (!isOpen || !duplicate) return null;

  const { primary, duplicate: candidateB, severity, matchType, confidence, reasons, suggestedAction } = duplicate;

  const severityBadgeClass =
    severity === 'HIGH'
      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
      : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';

  const matchTypeLabel =
    matchType === 'EXACT_MATCH'
      ? 'Exact Duplicate Claim'
      : matchType === 'NEAR_DATE_MATCH'
      ? 'Near-Date Match (±3 Days)'
      : matchType === 'BANK_COLLISION'
      ? 'Bank Statement vs Ledger Collision'
      : 'Fuzzy Merchant Match';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
        <div className="w-full glass-panel bg-white/95 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border flex items-center gap-1.5 ${severityBadgeClass}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {severity} SEVERITY SUSPECT
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700">
                  {Math.round(confidence * 100)}% Confidence
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Copy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                {matchTypeLabel}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Explanation Alert */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Audit Defense Heuristic Warning
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
              TaxShield Ledger detected two transactions with identical dollar amounts within a 3-day window. Double-claiming expenses creates severe IRS audit vulnerability under IRC § 162.
            </p>
            <div className="pt-1 border-t border-amber-500/20">
              <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                {reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Side-by-Side Transaction Inspection
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Candidate Card */}
              <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 space-y-3 relative">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    RECORD A ({primary.entityType.replace('_', ' ')})
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {primary.id.slice(0, 8)}</span>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Merchant / Payee</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{primary.payee}</div>
                </div>

                <div className="flex justify-between items-center py-2 border-y border-slate-100 dark:border-slate-800/80">
                  <div>
                    <div className="text-xs text-slate-400">Date</div>
                    <div className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {primary.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Amount</div>
                    <div className="text-lg font-mono font-black text-slate-900 dark:text-white">
                      ${primary.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Description / Purpose</div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 mt-0.5">
                    {primary.description || 'No description provided'}
                  </div>
                </div>

                {primary.category && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Category: <span className="text-slate-800 dark:text-slate-200 font-semibold">{primary.category}</span>
                  </div>
                )}
              </div>

              {/* Duplicate Candidate Card */}
              <div className="glass-card p-4 rounded-xl border-2 border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/20 space-y-3 relative">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                    RECORD B ({candidateB.entityType.replace('_', ' ')})
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {candidateB.id.slice(0, 8)}</span>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Merchant / Payee</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{candidateB.payee}</div>
                </div>

                <div className="flex justify-between items-center py-2 border-y border-amber-200/50 dark:border-amber-800/50">
                  <div>
                    <div className="text-xs text-slate-400">Date</div>
                    <div className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {candidateB.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Amount</div>
                    <div className="text-lg font-mono font-black text-rose-600 dark:text-rose-400">
                      ${candidateB.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Description / Purpose</div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 mt-0.5">
                    {candidateB.description || 'No description provided'}
                  </div>
                </div>

                {candidateB.category && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Category: <span className="text-slate-800 dark:text-slate-200 font-semibold">{candidateB.category}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Recommendation */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-100">Recommended Resolution: </span>
            {suggestedAction}
          </div>

          {/* Resolution Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onKeepBoth(duplicate.id);
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Keep Both (Legitimate Purchases)
            </button>

            {candidateB.entityType !== 'BANK_TRANSACTION' && (
              <button
                type="button"
                onClick={() => {
                  onDeleteCandidate(candidateB.id, candidateB.entityType);
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Duplicate Record B
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
