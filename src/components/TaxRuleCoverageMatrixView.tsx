import React, { useState } from 'react';
import { Company, Employee, CoverageMatrixItem } from 'taxshield-ledger-core';
import { generateTaxRuleCoverageReport } from 'taxshield-ledger-core';
import { ShieldCheck, AlertTriangle, RefreshCw, Layers, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { PackageSyncDrawer } from './PackageSyncDrawer';

interface Props {
  company: Company;
  employees: Employee[];
}

export const TaxRuleCoverageMatrixView: React.FC<Props> = ({ company, employees }) => {
  const [taxYear, setTaxYear] = useState<number>(2026);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'FEDERAL' | 'STATE' | 'LOCAL'>('ALL');
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);

  const report = generateTaxRuleCoverageReport(company, employees, taxYear);

  const filteredItems = report.items.filter(
    (item) => filterLevel === 'ALL' || item.level === filterLevel
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Phase 2 Module
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Fail-Closed Statutory Engine
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Tax Rule Coverage Matrix
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Evaluates statutory tax rule package coverage across active company locations and employee rosters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value, 10))}
              className="glass-input px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value={2026}>Tax Year 2026</option>
              <option value={2027}>Tax Year 2027</option>
            </select>

            <button
              onClick={() => setIsSyncDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Tax Packages
            </button>
          </div>
        </div>

        {/* Readiness Overview Banner */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Readiness Score
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {report.readinessPercentage}%
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  report.readinessPercentage === 100
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                }`}
              >
                {report.readinessPercentage === 100 ? 'Fully Ready' : 'Action Required'}
              </span>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Required Rules
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {report.totalRequiredJurisdictions}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Packages
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {report.activeCount}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payroll Engine Gate
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {report.isPayrollBlocked ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    BLOCKED
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    UNLOCKED
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {report.isPayrollBlocked && (
          <div className="mt-4 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              Payroll runs are fail-closed for this company until missing or unvalidated rules for{' '}
              <strong className="font-semibold">{report.blockingJurisdictions.join(', ')}</strong> are activated.
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
          {(['ALL', 'FEDERAL', 'STATE', 'LOCAL'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filterLevel === lvl
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lvl === 'ALL' ? 'All Jurisdictions' : lvl}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing {filteredItems.length} of {report.items.length} rules
        </div>
      </div>

      {/* Jurisdiction Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className={`glass-panel p-5 rounded-2xl border transition-all ${
              item.status === 'ACTIVE'
                ? 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70'
                : 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      item.level === 'FEDERAL'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                        : item.level === 'STATE'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                    }`}
                  >
                    {item.level}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {item.jurisdictionCode}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {item.jurisdictionName}
                </h3>
              </div>

              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                  item.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Rule Code:</span>
                <span className="ml-1 font-mono font-medium text-slate-900 dark:text-slate-200">
                  {item.ruleCode}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Citation Tier:</span>
                <span className="ml-1 font-medium text-slate-900 dark:text-slate-200">
                  {item.citationTier || 'TIER_1_OFFICIAL'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Active Version:</span>
                <span className="ml-1 font-semibold text-slate-900 dark:text-slate-200">
                  v{item.activeVersionNumber || 1}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Employees Affected:</span>
                <span className="ml-1 font-semibold text-slate-900 dark:text-slate-200">
                  {item.requiredForRosterCount}
                </span>
              </div>
            </div>

            {item.issueReason && (
              <p className="mt-3 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {item.issueReason}
              </p>
            )}
          </div>
        ))}
      </div>

      <PackageSyncDrawer isOpen={isSyncDrawerOpen} onClose={() => setIsSyncDrawerOpen(false)} />
    </div>
  );
};
