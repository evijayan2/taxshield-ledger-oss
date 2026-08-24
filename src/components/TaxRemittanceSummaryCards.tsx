import React from 'react';
import { Landmark, ExternalLink, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PayStub } from '../types';

interface TaxRemittanceSummaryCardsProps {
  payStubs: PayStub[];
  onOpenGuide: (guideKey: string) => void;
}

export function TaxRemittanceSummaryCards({
  payStubs,
  onOpenGuide
}: TaxRemittanceSummaryCardsProps) {
  // Aggregate live tax totals from paystubs
  const totalFIT = Math.round(payStubs.reduce((sum, s) => sum + (s.federalIncomeTax || 0), 0) * 100) / 100;
  const totalEESS = Math.round(payStubs.reduce((sum, s) => sum + (s.socialSecurityTax || 0), 0) * 100) / 100;
  const totalERSS = Math.round(payStubs.reduce((sum, s) => sum + (s.employerSocialSecurity || 0), 0) * 100) / 100;
  const totalEEMed = Math.round(payStubs.reduce((sum, s) => sum + (s.medicareTax || 0), 0) * 100) / 100;
  const totalERMed = Math.round(payStubs.reduce((sum, s) => sum + (s.employerMedicare || 0), 0) * 100) / 100;
  const totalFed941Liability = Math.round((totalFIT + totalEESS + totalERSS + totalEEMed + totalERMed) * 100) / 100;

  const totalPATax = Math.round(payStubs.reduce((sum, s) => sum + (s.paStateTax || 0), 0) * 100) / 100;
  const totalEmployerUC = Math.round(payStubs.reduce((sum, s) => sum + (s.employerPaUc || 0), 0) * 100) / 100;
  const totalLocalEIT = Math.round(payStubs.reduce((sum, s) => sum + (s.paLocalEit || 0), 0) * 100) / 100;
  const totalLST = Math.round(payStubs.reduce((sum, s) => sum + (s.paLst || 0), 0) * 100) / 100;
  const totalLocalLiability = Math.round((totalLocalEIT + totalLST) * 100) / 100;

  const fmt = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const buckets = [
    {
      key: 'FEDERAL_941',
      formNumber: 'FORM 941',
      title: 'Federal Payroll Tax (Form 941)',
      agency: 'IRS EFTPS • Form 941 / 944 Quarterly Return',
      amount: totalFed941Liability,
      details: `FIT (${fmt(totalFIT)}) + SS (${fmt(totalEESS + totalERSS)}) + Med (${fmt(totalEEMed + totalERMed)})`,
      portalUrl: 'https://www.eftps.gov',
      portalLabel: 'EFTPS.gov',
      badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    },
    {
      key: 'PA_SIT_REV1667',
      formNumber: 'FORM REV-1667',
      title: 'PA State Income Tax (Form REV-1667)',
      agency: 'PA Dept of Revenue • Form REV-1667 Withholding',
      amount: totalPATax,
      details: `3.07% PA State Income Tax Withheld from employee gross earnings`,
      portalUrl: 'https://mypath.pa.gov',
      portalLabel: 'myPATH.pa.gov',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    },
    {
      key: 'PA_UC2',
      formNumber: 'FORM UC-2',
      title: 'PA Unemployment Tax (Form UC-2 / UC-2A)',
      agency: 'PA Dept of Labor & Industry • Form UC-2 Quarterly',
      amount: totalEmployerUC,
      details: `Employer UC Contribution (3.822%) + Employee UC Withholding`,
      portalUrl: 'https://www.uc.pa.gov',
      portalLabel: 'PA UC Portal',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    },
    {
      key: 'PA_LOCAL_EIT',
      formNumber: 'LOCAL ACT 32',
      title: 'PA Local EIT & LST (Act 32 PSD Return)',
      agency: 'Local Collector • Keystone / Berkheimer EIT Return',
      amount: totalLocalLiability,
      details: `Local EIT (${fmt(totalLocalEIT)}) + Local Services Tax (${fmt(totalLST)})`,
      portalUrl: 'https://pay.keystonecollects.com',
      portalLabel: 'Local Collector',
      badgeColor: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-indigo-500" />
          <span>Current Tax Liabilities & Payment Portals</span>
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Calculated from locked paystubs</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {buckets.map((b) => (
          <div
            key={b.key}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider font-mono border ${b.badgeColor}`}>
                  {b.formNumber}
                </span>
                <a
                  href={b.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>{b.portalLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{b.title}</h4>
              <p className="text-[11px] font-mono text-slate-400 truncate">{b.agency}</p>
            </div>

            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Due</span>
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {fmt(b.amount)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                {b.details}
              </p>
            </div>

            <button
              onClick={() => onOpenGuide(b.key)}
              className="w-full py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800/60 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>How & Where to Pay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
