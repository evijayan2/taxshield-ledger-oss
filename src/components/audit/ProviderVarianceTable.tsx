import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { AuditComparisonResult, AuditVarianceLine } from '../../types';

interface ProviderVarianceTableProps {
  comparisons: AuditComparisonResult[];
}

function getBadge(status: string) {
  if (status === 'CLEAN') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" /> Clean Match
      </span>
    );
  }
  if (status === 'WARNING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
        <AlertTriangle className="w-3.5 h-3.5" /> Minor Drift
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
      <AlertCircle className="w-3.5 h-3.5" /> Discrepancy
    </span>
  );
}

function getPill(v: AuditVarianceLine) {
  if (v.category === 'MATCH') return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
  if (v.category === 'ROUNDING_DRIFT') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300';
  if (v.category === 'S_CORP_HEALTH_ERROR') return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold';
  return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold';
}

export function ProviderVarianceTable({ comparisons }: ProviderVarianceTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
        <thead className="bg-slate-50 dark:bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-3 py-3">Period</th>
            <th className="px-3 py-3 text-right">Gross</th>
            <th className="px-3 py-3 text-right">Provider Net</th>
            <th className="px-3 py-3 text-right">TaxShield Net</th>
            <th className="px-3 py-3 text-center">Status</th>
            <th className="px-3 py-3 text-center">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {comparisons.map((c, idx) => {
            const isExp = expandedRow === idx;
            return (
              <React.Fragment key={idx}>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{c.employeeName}</td>
                  <td className="px-3 py-3 text-slate-500">{c.checkDate}</td>
                  <td className="px-3 py-3 text-right font-mono">${c.providerRow.grossWages.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-mono">${c.providerRow.netPay.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    ${c.taxShieldCalculated ? c.taxShieldCalculated.netPay.toFixed(2) : '-'}
                  </td>
                  <td className="px-3 py-3 text-center">{getBadge(c.status)}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => setExpandedRow(isExp ? null : idx)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                      aria-label="Toggle details"
                    >
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
                {isExp && (
                  <tr>
                    <td colSpan={7} className="px-4 py-3 bg-slate-50/75 dark:bg-slate-900/50">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Itemized Statutory Variance Audit:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {c.variances.map((v, vIdx) => (
                            <div key={vIdx} className={`p-2 rounded-lg border text-[11px] ${getPill(v)}`}>
                              <div className="flex justify-between font-medium">
                                <span>{v.displayName}</span>
                                <span>Delta: ${Math.abs(v.delta).toFixed(2)}</span>
                              </div>
                              <p className="mt-1 text-[10px] opacity-90">{v.explanation}</p>
                              {v.statutoryCitation && (
                                <p className="mt-0.5 text-[9px] font-semibold tracking-wide uppercase opacity-75">
                                  Ref: {v.statutoryCitation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
