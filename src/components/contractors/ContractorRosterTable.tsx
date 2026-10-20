import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Send, 
  UserPlus, 
  Users, 
  Eye 
} from 'lucide-react';
import type { 
  ContractorComplianceSummary, 
  Contractor1099Status 
} from 'taxshield-ledger-core';
import type { ContractorWorker } from './Contractor1099HubView';

export interface ContractorRosterTableProps {
  summaries: ContractorComplianceSummary[];
  contractors: ContractorWorker[];
  statutoryThreshold: number;
  onDownload1099: (summary: ContractorComplianceSummary) => void;
  onOpenInvite: (contractorId?: string) => void;
  onOpenAddContractor: () => void;
}

/**
 * Roster table rendering 1099 contractors, compliance status badges, and action triggers.
 */
export function ContractorRosterTable({
  summaries,
  statutoryThreshold,
  onDownload1099,
  onOpenInvite,
  onOpenAddContractor,
}: ContractorRosterTableProps) {
  const getStatusBadge = (status: Contractor1099Status, ytd: number) => {
    switch (status) {
      case 'THRESHOLD_MET':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            ● 1099-NEC READY (${ytd.toFixed(0)})
          </span>
        );
      case 'BELOW_THRESHOLD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ● BELOW THRESHOLD (${ytd.toFixed(0)} / ${statutoryThreshold.toFixed(0)})
          </span>
        );
      case 'MISSING_W9':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            ● MISSING W-9
          </span>
        );
      case 'EXEMPT_ENTITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            ● EXEMPT (C/S-CORP)
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase">
            <tr>
              <th className="px-5 py-3">Contractor / DBA</th>
              <th className="px-5 py-3">TIN (Masked)</th>
              <th className="px-5 py-3">W-9 Form Status</th>
              <th className="px-5 py-3 text-right">YTD Paid</th>
              <th className="px-5 py-3 text-center">Compliance Badge</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">No 1099 Contractors Found</p>
                      <p className="text-slate-500 text-xs mt-1">
                        Add contractor details to track nonemployee payments, maintain statutory compliance, and collect Form W-9s.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenAddContractor}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Contractor Details & Invite
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              summaries.map((s) => (
                <tr key={s.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900 dark:text-white">{s.contractorName}</p>
                    {s.businessName && <p className="text-[11px] text-slate-500">DBA: {s.businessName}</p>}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                    {s.tinMasked || 'None on file'}
                  </td>
                  <td className="px-5 py-3.5">
                    {s.hasCertifiedW9 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Certified
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing W-9
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    ${s.ytdTotalPaid.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-center">{getStatusBadge(s.status, s.ytdTotalPaid)}</td>
                  <td className="px-5 py-3.5 text-right space-x-1.5">
                    <button
                      onClick={() => onOpenInvite(s.employeeId)}
                      title={s.hasCertifiedW9 ? "View Details / Re-invite" : "Send W-9 Onboarding Invite"}
                      className="px-2.5 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 transition-colors"
                    >
                      {s.hasCertifiedW9 ? <Eye className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                      {s.hasCertifiedW9 ? 'Details' : 'Send W-9'}
                    </button>
                    {s.status === 'THRESHOLD_MET' && (
                      <button
                        onClick={() => onDownload1099(s)}
                        title="Download Form 1099-NEC PDF (Copy B & C)"
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 inline-flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> 1099-NEC
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
