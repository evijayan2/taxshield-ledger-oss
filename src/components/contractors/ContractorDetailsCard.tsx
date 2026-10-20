import React from 'react';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  FileText 
} from 'lucide-react';
import type { ContractorOption } from './W9InviteDrawer';

export interface ContractorDetailsCardProps {
  contractor: ContractorOption;
}

/**
 * Visual details card displaying full contractor profile, classification, and W-9 compliance status.
 */
export function ContractorDetailsCard({ contractor }: ContractorDetailsCardProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-500" />
            {contractor.name}
          </h4>
          {contractor.businessName && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              DBA: {contractor.businessName}
            </p>
          )}
        </div>
        <div>
          {contractor.hasCertifiedW9 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" /> W-9 Certified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3 h-3" /> Missing W-9
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5 truncate">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{contractor.email}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{contractor.phone || 'No phone on file'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>TIN: {contractor.tinMasked || 'Pending W-9 submission'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>YTD: ${(contractor.ytdTotalPaid || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
