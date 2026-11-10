import React from 'react';
import { 
  DollarSign, 
  Car, 
  Calculator, 
  Receipt, 
  ShieldCheck, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  Landmark, 
  Clock, 
  ArrowRight, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';
import { AllAppData } from '../types';
import { getRecordYear, getTaskTaxYear } from '../utils/taxEngine';
import { calculateAuditReadiness } from 'taxshield-ledger-core';

interface DashboardOverviewViewProps {
  data: AllAppData;
  onNavigateTab: (tab: import('./NavigationSidebar').NavigationTab) => void;
}

/**
 * Production-Grade Executive Financial Dashboard component for TaxShield Ledger.
 * Unified under a strict Emerald + Slate corporate accounting palette.
 */
export function DashboardOverviewView({ data, onNavigateTab }: DashboardOverviewViewProps) {
  const activeYear = data.activeTaxYear || 2026;

  // Live Audit Readiness Evaluation
  const auditReport = React.useMemo(() => {
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
    });
  }, [data, activeYear]);

  const generalExpenses = data.generalExpenses.filter(e => getRecordYear(e.expenseDate) === activeYear);
  const mileageLogs = data.mileageLogs.filter(m => getRecordYear(m.tripDate) === activeYear);
  const payrollRuns = data.payrollRuns.filter(p => getRecordYear(p.payDate || p.periodStart) === activeYear);
  const payStubs = (data.payStubs || []).filter(s => getRecordYear(s.payDate || s.periodStart) === activeYear);
  const complianceTasks = (data.complianceTasks || []).filter(t => getTaskTaxYear(t) === activeYear);

  const totalGeneralExpenses = generalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMileageDeduction = mileageLogs.reduce((sum, m) => sum + m.mileageAllowance, 0);
  const totalPayrollGross = payrollRuns.reduce((sum, p) => sum + p.totalGross, 0);
  const totalDeductions = totalGeneralExpenses + totalMileageDeduction;

  // Federal Tax Breakdown (Form 941)
  const totalFIT = Math.round(payStubs.reduce((sum, s) => sum + (s.federalIncomeTax || 0), 0) * 100) / 100;
  const totalEESS = Math.round(payStubs.reduce((sum, s) => sum + (s.socialSecurityTax || 0), 0) * 100) / 100;
  const totalERSS = Math.round(payStubs.reduce((sum, s) => sum + (s.employerSocialSecurity || 0), 0) * 100) / 100;
  const totalSSTax = Math.round((totalEESS + totalERSS) * 100) / 100;
  const totalEEMed = Math.round(payStubs.reduce((sum, s) => sum + (s.medicareTax || 0), 0) * 100) / 100;
  const totalERMed = Math.round(payStubs.reduce((sum, s) => sum + (s.employerMedicare || 0), 0) * 100) / 100;
  const totalMedTax = Math.round((totalEEMed + totalERMed) * 100) / 100;
  const totalFedLiability = Math.round((totalFIT + totalSSTax + totalMedTax) * 100) / 100;

  // PA State Tax Breakdown (REV-1667 & UC-2)
  const totalPATax = Math.round(payStubs.reduce((sum, s) => sum + (s.paStateTax || 0), 0) * 100) / 100;
  const totalEmployerUC = Math.round(payStubs.reduce((sum, s) => sum + (s.employerPaUc || 0), 0) * 100) / 100;
  const totalStateLiability = Math.round((totalPATax + totalEmployerUC) * 100) / 100;

  // Local Tax Breakdown (PA Act 32 EIT & LST)
  const totalLocalEIT = Math.round(payStubs.reduce((sum, s) => sum + (s.paLocalEit || 0), 0) * 100) / 100;
  const totalLST = Math.round(payStubs.reduce((sum, s) => sum + (s.paLst || 0), 0) * 100) / 100;
  const totalLocalLiability = Math.round((totalLocalEIT + totalLST) * 100) / 100;

  // Combined Total
  const totalTaxLiabilityAll = Math.round((totalFedLiability + totalStateLiability + totalLocalLiability) * 100) / 100;

  // Task Statuses
  const fedTask = complianceTasks.find(t => t.formIdentifier === 'FORM_941' || t.jurisdiction === 'FEDERAL_IRS');
  const stateTask = complianceTasks.find(t => t.formIdentifier === 'REV_1667' || t.jurisdiction === 'PA_MYPATH_SIT');
  const localTask = complianceTasks.find(t => t.formIdentifier === 'PA_LOCAL_EIT' || t.jurisdiction === 'LOCAL_EIT');

  const isFedFiled = fedTask?.status === 'FILED';
  const isStateFiled = stateTask?.status === 'FILED';
  const isLocalFiled = localTask?.status === 'FILED';

  const unpaidTasks = complianceTasks.filter(t => t.status !== 'FILED');
  const unpaidTaxCount = unpaidTasks.length;
  const sortedUnpaid = [...unpaidTasks].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const nextDueTask = sortedUnpaid[0];
  const nextDueTitle = nextDueTask?.title || 'PA State REV-1667 Withholding Return';
  const nextDueDate = nextDueTask?.dueDate || `${activeYear}-09-15`;

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6 border border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
              Tax Year {data.activeTaxYear} Active
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Audit Logged
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('AUDIT_READINESS')}
              className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{auditReport.overallScore}% Audit-Ready ({auditReport.tier.replace('_', ' ')})</span>
            </button>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {data.org.name || 'Company Financial Ledger'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl">
            Audit-ready expense tracking, IRS mileage log, PA state & local payroll engine, and Schedule C tax deduction analytics.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => onNavigateTab('EXPENSES')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-semibold text-sm rounded-xl transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Expense
          </button>
          <button
            onClick={() => onNavigateTab('MILEAGE')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Log Mileage
          </button>
        </div>
      </div>

      {/* Dedicated Continuous Audit Defense & Readiness Banner Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex flex-col items-center justify-center font-mono font-black text-xl shrink-0">
            <span>{auditReport.overallScore}%</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Continuous IRS Audit Readiness: {auditReport.tier.replace('_', ' ')}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {auditReport.summaryStats.missingReceiptsOver75Count === 0
                ? 'All expenses ≥ $75 possess documentary evidence.'
                : `${auditReport.summaryStats.missingReceiptsOver75Count} expense(s) ≥ $75 missing receipt documentation.`}{' '}
              {auditReport.duplicates.length > 0 && `${auditReport.duplicates.length} suspected duplicate transaction(s) pending review.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('AUDIT_READINESS')}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
        >
          <span>Open Audit Defense Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Clean Statutory Deadline Alert Banner */}
      {unpaidTaxCount > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold flex-shrink-0 border border-amber-300 dark:border-amber-700">
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                  REMITTANCE PENDING ({unpaidTaxCount})
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Next Deadline: <span className="text-amber-800 dark:text-amber-300 font-mono">{nextDueTitle}</span> (Due {nextDueDate})
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Total Unpaid Tax Obligations: <strong className="text-slate-900 dark:text-white font-mono">{fmt(totalTaxLiabilityAll)}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('COMPLIANCE')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Open Remittance Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Total YTD Deductions</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-3">
            ${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Reduces Taxable Income</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Operating Expenses</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-3">
            ${totalGeneralExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block font-medium">{data.generalExpenses.length} receipt entries</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>IRS Mileage Allowance</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-3">
            ${totalMileageDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block font-medium">{data.mileageLogs.length} verified trips</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Gross Payroll Paid</span>
            <Calculator className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-3">
            ${totalPayrollGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block font-medium">{data.payStubs.length} issued paystubs</span>
        </div>
      </div>

      {/* Tax Remittances & Liabilities Section (Federal, State, Local) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Tax Remittances & Liabilities Due (Federal, State, Local)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live calculated tax withholding and employer payroll obligations across Federal, Pennsylvania State, and Local jurisdictions.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('COMPLIANCE')}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Compliance Hub & ACH Payouts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Jurisdiction Cards: Federal, State, Local */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Federal Taxes Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  FEDERAL (IRS 941)
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isFedFiled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}>
                  {isFedFiled ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                  <span>{isFedFiled ? 'PAID & FILED' : 'REMITTANCE DUE'}</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Federal Payroll Taxes</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">IRS EFTPS • Form 941 Return</p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">Total Federal Due</span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {fmt(totalFedLiability)}
                </span>
              </div>

              <div className="space-y-1 pt-1 text-xs divide-y divide-slate-200/60 dark:divide-slate-800/60">
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-600 dark:text-slate-400">Federal Income Tax (FIT):</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmt(totalFIT)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-600 dark:text-slate-400">Social Security (12.4% EE+ER):</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmt(totalSSTax)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-600 dark:text-slate-400">Medicare (2.9% EE+ER):</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmt(totalMedTax)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 font-medium">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payment Due Date:</span>
                  </span>
                  <span className={`font-mono font-bold ${isFedFiled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {isFedFiled ? `Paid (${fedTask?.filedDate || 'Filed'})` : (fedTask?.dueDate || '2026-10-31')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('COMPLIANCE')}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isFedFiled ? 'View Paid Filing' : 'Pay Federal Tax (EFTPS)'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>

          {/* Pennsylvania State Taxes Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  STATE (PA REV-1667 & UC)
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isStateFiled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}>
                  {isStateFiled ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                  <span>{isStateFiled ? 'PAID & FILED' : 'REMITTANCE DUE'}</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">PA State Income & UC Taxes</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">PA Dept of Revenue • myPATH Portal</p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">Total State Due</span>
                <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                  {fmt(totalStateLiability)}
                </span>
              </div>

              <div className="space-y-1 pt-1 text-xs divide-y divide-slate-200/60 dark:divide-slate-800/60">
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-600 dark:text-slate-400">PA State Income Tax (3.07%):</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmt(totalPATax)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-600 dark:text-slate-400">PA Unemployment (Form UC-2):</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmt(totalEmployerUC)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 font-medium">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payment Due Date:</span>
                  </span>
                  <span className={`font-mono font-bold ${isStateFiled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {isStateFiled ? `Paid (${stateTask?.filedDate || 'Filed'})` : (stateTask?.dueDate || '2026-09-15')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('COMPLIANCE')}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isStateFiled ? 'View Paid Filing' : 'Pay PA Tax (myPATH)'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>

          {/* Local PA Taxes Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  LOCAL (PA ACT 32 EIT)
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isLocalFiled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}>
                  {isLocalFiled ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-slate-400" />}
                  <span>{isLocalFiled ? 'PAID & FILED' : 'REMITTANCE DUE'}</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Local EIT & LST Taxes</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Local Collector • Act 32 PSD Return</p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">Total Local Due</span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {fmt(totalLocalLiability)}
                </span>
              </div>

              <div className="space-y-1 pt-1 text-xs divide-y divide-slate-200/60 dark:divide-slate-800/60">
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-600 dark:text-slate-400">Local EIT Withheld:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmt(totalLocalEIT)}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-600 dark:text-slate-400">Local Services Tax (LST):</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmt(totalLST)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 font-medium">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payment Due Date:</span>
                  </span>
                  <span className={`font-mono font-bold ${isLocalFiled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {isLocalFiled ? `Paid (${localTask?.filedDate || 'Filed'})` : (localTask?.dueDate || '2026-10-31')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('COMPLIANCE')}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isLocalFiled ? 'View Paid Filing' : 'Pay Local Collector'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>

        </div>

        {/* Overall Tax Liability Summary Banner */}
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-200 dark:border-slate-800 shadow-xs">
          <div>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-wider block">Combined Total Tax Liability Due (Federal + State + Local)</span>
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              {fmt(totalTaxLiabilityAll)}
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Live breakdown computed from issued employee paystubs in Tax Year {data.activeTaxYear}.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('COMPLIANCE')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Remittance Hub</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div 
          onClick={() => onNavigateTab('EXPENSES')}
          className="glass-card p-6 rounded-2xl cursor-pointer hover:border-emerald-500/40 group transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Expenses & Receipts</h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Log vendor receipts, map expenses to Schedule C lines, and maintain audit-proof documentation.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('PAYROLL')}
          className="glass-card p-6 rounded-2xl cursor-pointer hover:border-emerald-500/40 group transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Payroll & Taxes</h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Run PA state (3.07%), local EIT/LST, and W-4 federal tax withholding with immutable calculation snapshots.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('EXPORT')}
          className="glass-card p-6 rounded-2xl cursor-pointer hover:border-emerald-500/40 group transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Accountant Export</h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Generate CSV, Excel spreadsheets, and year-end packages for your CPA tax return.
          </p>
        </div>
      </div>
    </div>
  );
}
