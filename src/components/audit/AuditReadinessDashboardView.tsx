import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Receipt,
  Car,
  Briefcase,
  ArrowRightLeft,
  FileText,
  Copy,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  AllAppData,
  CompanyAuditReadinessReport,
  DuplicateExpenseMatch,
  NeedsAttentionItem,
  AuditReadinessTier
} from '../../types';
import { calculateAuditReadiness } from 'taxshield-ledger-core';
import { DuplicateExpenseDrawer } from './DuplicateExpenseDrawer';
import { NavigationTab } from '../NavigationSidebar';

interface AuditReadinessDashboardViewProps {
  data: AllAppData;
  onNavigateTab: (tab: NavigationTab) => void;
  onDeleteExpense?: (id: string) => void;
  onDeleteTravelExpense?: (id: string) => void;
}

/**
 * Executive Audit Defense & Continuous Readiness Dashboard for TaxShield Ledger.
 * Evaluates 6 pillars: Receipt Proof, Business Purpose, Bank Reconciliation,
 * Mileage 5-Point Logs, Contractor 1099 W-9s, and Duplicate Transaction Integrity.
 */
export function AuditReadinessDashboardView({
  data,
  onNavigateTab,
  onDeleteExpense,
  onDeleteTravelExpense,
}: AuditReadinessDashboardViewProps) {
  const activeYear = data.activeTaxYear || 2026;

  // Local state for dismissed duplicate pairs (in memory during session)
  const [dismissedPairKeys, setDismissedPairKeys] = useState<string[]>([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateExpenseMatch | null>(null);
  const [isDuplicateDrawerOpen, setIsDuplicateDrawerOpen] = useState(false);
  const [actionFilter, setActionFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'DUPLICATES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedExport, setCopiedExport] = useState(false);

  // Compute live Audit Readiness Report
  const report: CompanyAuditReadinessReport = useMemo(() => {
    return calculateAuditReadiness({
      companyId: data.company.id || 'comp_main',
      taxYear: activeYear,
      generalExpenses: data.generalExpenses || [],
      travelExpenses: data.travelExpenses || [],
      mileageLogs: data.mileageLogs || [],
      bankTransactions: data.bankTransactions || [],
      contractorPayments: data.contractorPayments || [],
      w9Records: data.w9Records || [],
      employees: data.employees || [],
      statutory1099Threshold: 600,
      dismissedDuplicateKeys: dismissedPairKeys,
    });
  }, [data, activeYear, dismissedPairKeys]);

  const { overallScore, tier, pillars, duplicates, actionItems, summaryStats } = report;

  // Dismiss duplicate handler
  const handleKeepBoth = (matchId: string) => {
    setDismissedPairKeys((prev) => [...prev, matchId]);
  };

  // Delete duplicate handler
  const handleDeleteCandidate = (candidateId: string, entityType: string) => {
    if (entityType === 'GENERAL_EXPENSE' && onDeleteExpense) {
      onDeleteExpense(candidateId);
    } else if (entityType === 'TRAVEL_EXPENSE' && onDeleteTravelExpense) {
      onDeleteTravelExpense(candidateId);
    }
  };

  // Filter action items
  const filteredActionItems = useMemo(() => {
    return actionItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (actionFilter === 'CRITICAL') return item.severity === 'CRITICAL';
      if (actionFilter === 'WARNING') return item.severity === 'WARNING';
      if (actionFilter === 'DUPLICATES') return item.entityType === 'DUPLICATE';
      return true;
    });
  }, [actionItems, actionFilter, searchQuery]);

  // Export audit defense checklist
  const handleExportChecklist = () => {
    const lines = [
      `# TaxShield Ledger — CPA Audit Defense & Readiness Summary`,
      `Company: ${data.company.name || 'Micro-LLC'} (EIN: ${data.company.ein || 'XX-XXXXXXX'})`,
      `Tax Year: ${activeYear}`,
      `Evaluation Date: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`,
      `Overall Audit Readiness Score: ${overallScore}% (${tier})`,
      ``,
      `## 6-Pillar Compliance Metrics`,
      `- Receipt Attachment Coverage (IRC § 274(d)): ${pillars.receiptCoverage.score}% (${pillars.receiptCoverage.metrics.detail})`,
      `- Business Purpose Quality (IRC § 162): ${pillars.businessPurposeQuality.score}% (${pillars.businessPurposeQuality.metrics.detail})`,
      `- Bank Statement Reconciliation: ${pillars.bankReconciliation.score}% (${pillars.bankReconciliation.metrics.detail})`,
      `- Mileage 5-Point Log Standard (Pub. 463): ${pillars.mileageCompleteness.score}% (${pillars.mileageCompleteness.metrics.detail})`,
      `- Contractor 1099 Compliance (IRC § 6041A): ${pillars.contractorCompliance.score}% (${pillars.contractorCompliance.metrics.detail})`,
      `- Duplicate Transaction Integrity: ${pillars.duplicateHealth.score}% (${pillars.duplicateHealth.metrics.detail})`,
      ``,
      `## Summary Financial Metrics`,
      `- Total Deductible Expenses: $${summaryStats.totalExpensesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} across ${summaryStats.totalExpensesCount} transactions`,
      `- Bank Reconciled Disbursements: ${summaryStats.reconciledExpensesCount} transactions verified against bank statements`,
      `- Pending Action Items: ${actionItems.length} issues identified`,
      ``,
      `## Action Items & Required Disclosures`,
      ...actionItems.map((a, i) => `${i + 1}. [${a.severity}] ${a.title} — ${a.description} (${a.suggestedFix})`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Readiness_Report_${activeYear}_${data.company.name?.replace(/\s+/g, '_') || 'Company'}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 3000);
  };

  // Tier styling
  const tierBadge = {
    AUDIT_READY: {
      label: 'AUDIT-READY · DEFENSE GRADE',
      color: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
      description: 'Your business deductions meet all statutory IRS documentation standards.',
    },
    GOOD_STANDING: {
      label: 'GOOD STANDING · MINOR GAPS',
      color: 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400',
      description: 'Ledger is in good standing with minor receipt or purpose documentation gaps.',
    },
    NEEDS_ATTENTION: {
      label: 'NEEDS ATTENTION · ACTION REQUIRED',
      color: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300',
      description: 'Action required before filing: missing receipts or unreconciled bank statements detected.',
    },
    AUDIT_RISK: {
      label: 'HIGH AUDIT RISK · SIGNIFICANT EXPOSURE',
      color: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300',
      description: 'High audit risk: substantial deductions lack receipts, purposes, or W-9 compliance.',
    },
  }[tier];

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
              Tax Year {activeYear} Defense
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border flex items-center gap-1.5 ${tierBadge.color}`}>
              {overallScore >= 90 ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {tierBadge.label}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Audit Defense & Readiness Dashboard
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
            {tierBadge.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleExportChecklist}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            {copiedExport ? 'Report Downloaded!' : 'Export CPA Defense Checklist'}
          </button>
        </div>
      </div>

      {/* Top Stat Grid: Dial + Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score Dial Card */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overall Audit Score
            </span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={overallScore >= 90 ? 'text-emerald-500' : overallScore >= 75 ? 'text-emerald-600' : overallScore >= 50 ? 'text-amber-500' : 'text-rose-500'}
                  strokeDasharray={`${overallScore}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono font-black text-2xl text-slate-900 dark:text-white">
                {overallScore}%
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Defense Rating</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {overallScore >= 90 ? 'CPA Audit Grade' : overallScore >= 75 ? 'Substantially Documented' : 'Action Required'}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
            Weighted across 6 IRS regulatory pillars
          </div>
        </div>

        {/* Missing Receipts (≥$75) */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              IRS § 274(d) Receipts
            </span>
            <Receipt className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
              {summaryStats.missingReceiptsOver75Count === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> 100% Attached
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5" /> {summaryStats.missingReceiptsOver75Count} Missing
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mandatory receipts for expenses ≥ $75
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('EXPENSES')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer"
          >
            Review Expenses <ArrowRightLeft className="w-3 h-3" />
          </button>
        </div>

        {/* Bank Reconciliation Status */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bank Statement Match
            </span>
            <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
              {pillars.bankReconciliation.metrics.percentage}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {pillars.bankReconciliation.metrics.detail}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('RECONCILIATION')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer"
          >
            Open Reconciliation <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Duplicate Expense Suspects */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Duplicate Integrity
            </span>
            <Copy className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
              {duplicates.length === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" /> 0 Duplicates
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5" /> {duplicates.length} Suspects
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cross-scanned across expenses & bank lines
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionFilter('DUPLICATES')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 cursor-pointer"
          >
            View Suspects <AlertTriangle className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 6 Pillars Breakdown Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Statutory IRS Compliance Pillars
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(pillars).map((p) => {
            const statusClass =
              p.status === 'EXCELLENT'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                : p.status === 'GOOD'
                ? 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                : p.status === 'NEEDS_WORK'
                ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800';

            const barColor =
              p.score >= 90
                ? 'bg-emerald-500'
                : p.score >= 75
                ? 'bg-emerald-600'
                : p.score >= 50
                ? 'bg-amber-500'
                : 'bg-rose-500';

            return (
              <div
                key={p.id}
                className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${statusClass}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Score ({Math.round(p.weight * 100)}% Weight)</span>
                    <span className="text-slate-900 dark:text-white font-bold">{p.score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${p.score}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono text-right">
                    {p.metrics.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* "Needs Attention" Action Center */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              "Needs Attention" Audit Defense Action Center
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prioritized checklist of documentation tasks required to reach 100% IRS audit-ready standing.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActionFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                actionFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All ({actionItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                actionFilter === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              Critical ({actionItems.filter((i) => i.severity === 'CRITICAL').length})
            </button>
            <button
              type="button"
              onClick={() => setActionFilter('WARNING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                actionFilter === 'WARNING'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              Warnings ({actionItems.filter((i) => i.severity === 'WARNING').length})
            </button>
            {duplicates.length > 0 && (
              <button
                type="button"
                onClick={() => setActionFilter('DUPLICATES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  actionFilter === 'DUPLICATES'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                Duplicates ({duplicates.length})
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search action items by vendor, issue, or IRS regulation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-9 pr-4 py-2 rounded-xl text-sm"
          />
        </div>

        {/* Items List */}
        {filteredActionItems.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Zero Outstanding Action Items
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All transactions in this category have full documentary evidence and satisfy statutory IRS requirements.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActionItems.map((item) => {
              const isCritical = item.severity === 'CRITICAL';
              const isDupe = item.entityType === 'DUPLICATE';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isCritical
                      ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isCritical ? (
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        {item.irsReference && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.irsReference}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>Action: {item.suggestedFix}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto">
                    {isDupe ? (
                      <button
                        type="button"
                        onClick={() => {
                          const match = duplicates.find((d) => d.id === item.entityId);
                          if (match) {
                            setSelectedDuplicate(match);
                            setIsDuplicateDrawerOpen(true);
                          }
                        }}
                        className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Review Suspect
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(item.actionRoute as NavigationTab)}
                        className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        Resolve in {item.actionRoute} <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Duplicate Inspection Slide-Over Drawer */}
      <DuplicateExpenseDrawer
        isOpen={isDuplicateDrawerOpen}
        onClose={() => {
          setIsDuplicateDrawerOpen(false);
          setSelectedDuplicate(null);
        }}
        duplicate={selectedDuplicate}
        onKeepBoth={handleKeepBoth}
        onDeleteCandidate={handleDeleteCandidate}
      />
    </div>
  );
}
