import React from 'react';
import { 
  DollarSign, 
  Car, 
  Calculator, 
  Receipt, 
  ShieldCheck, 
  TrendingUp, 
  FileText, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  Landmark,
  Clock,
  ArrowRight,
  Calendar,
  AlertTriangle,
  CreditCard,
  BellRing
} from 'lucide-react';
import { AllAppData } from '../types';
import { getRecordYear, getTaskTaxYear } from '../utils/taxEngine';

interface DashboardOverviewViewProps {
  data: AllAppData;
  onNavigateTab: (tab: import('./NavigationSidebar').NavigationTab) => void;
}

/**
 * Modern Executive Financial Dashboard component for TaxShield Ledger.
 */
export function DashboardOverviewView({ data, onNavigateTab }: DashboardOverviewViewProps) {
  const activeYear = data.activeTaxYear || 2026;

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

  // Pending Unpaid Remittances & Urgent Deadline Calculation
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
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-indigo-500/20">
        <div className="ambient-glow-indigo top-0 left-0" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-semibold">
              Tax Year {data.activeTaxYear} Active
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Audit Logged
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {data.org.name || 'Micro-LLC Financial Ledger'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl">
            Audit-ready expense tracking, 5-point IRS mileage log, PA state & local payroll engine, and Schedule C tax deduction analytics.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => onNavigateTab('EXPENSES')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Expense
          </button>
          <button
            onClick={() => onNavigateTab('MILEAGE')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Log Mileage
          </button>
        </div>
      </div>

      {/* High-Visibility Tax Payment Deadline Alert Banner */}
      {unpaidTaxCount > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border-2 border-amber-500/50 dark:border-amber-500/70 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 z-10">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black flex-shrink-0 shadow-lg shadow-amber-500/30 animate-bounce">
              <AlertTriangle className="w-6 h-6 text-slate-950" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs animate-pulse flex items-center gap-1">
                  <BellRing className="w-3 h-3" />
                  TAX REMITTANCE ALERT
                </span>
                <span className="text-xs font-mono font-extrabold text-amber-900 dark:text-amber-200">
                  {unpaidTaxCount} Filing{unpaidTaxCount === 1 ? '' : 's'} Pending
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                Upcoming Tax Deadline: <span className="text-amber-700 dark:text-amber-400 font-mono underline decoration-amber-500">{nextDueTitle}</span> (Due {nextDueDate})
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl">
                Total Unpaid Tax Liabilities: <strong className="text-slate-950 dark:text-white font-mono text-sm">{fmt(totalTaxLiabilityAll)}</strong>. Remit before statutory due dates to maintain zero-penalty status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 z-10 self-end md:self-center">
            <button
              onClick={() => onNavigateTab('COMPLIANCE')}
              className="px-4 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 transition flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/25"
            >
              <CreditCard className="w-4 h-4" />
              <span>Disburse ACH / Record Payout</span>
            </button>
          </div>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Total YTD Deductions</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            ${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Reduces Schedule C Taxable Income</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Operating Expenses</span>
            <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            ${totalGeneralExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block">{data.generalExpenses.length} receipt entries</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>IRS Mileage Allowance</span>
            <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-3">
            ${totalMileageDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block">{data.mileageLogs.length} verified trips</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
            <span>Gross Payroll Paid</span>
            <Calculator className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            ${totalPayrollGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 block">{data.payStubs.length} issued paystubs</span>
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
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
          >
            <span>Compliance Hub & ACH Payouts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Jurisdiction Cards: Federal, State, Local */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Federal Taxes Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                  FEDERAL (IRS 941)
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isFedFiled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                }`}>
                  {isFedFiled ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />}
                  <span>{isFedFiled ? 'PAID & FILED' : 'REMITTANCE DUE'}</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Federal Payroll Taxes</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">IRS EFTPS • Form 941 Return</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Federal Due</span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {fmt(totalFedLiability)}
                </span>
              </div>

              <div className="space-y-1 pt-1 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
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
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Payment Due Date:</span>
                  </span>
                  <span className={`font-mono font-bold ${isFedFiled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {isFedFiled ? `Paid (${fedTask?.filedDate || 'Filed'})` : (fedTask?.dueDate || '2026-10-31')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('COMPLIANCE')}
              className="w-full py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isFedFiled ? 'View Paid Filing' : 'Pay Federal Tax (EFTPS)'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
            </button>
          </div>

          {/* Pennsylvania State Taxes Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  STATE (PA REV-1667 & UC)
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isStateFiled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                }`}>
                  {isStateFiled ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />}
                  <span>{isStateFiled ? 'PAID & FILED' : 'REMITTANCE DUE'}</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">PA State Income & UC Taxes</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">PA Dept of Revenue • myPATH Portal</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total State Due</span>
                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {fmt(totalStateLiability)}
                </span>
              </div>

              <div className="space-y-1 pt-1 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
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
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Payment Due Date:</span>
                  </span>
                  <span className={`font-mono font-bold ${isStateFiled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {isStateFiled ? `Paid (${stateTask?.filedDate || 'Filed'})` : (stateTask?.dueDate || '2026-09-15')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('COMPLIANCE')}
              className="w-full py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isStateFiled ? 'View Paid Filing' : 'Pay PA Tax (myPATH)'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
            </button>
          </div>

          {/* Local PA Taxes Card */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                  LOCAL (PA ACT 32 EIT)
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isLocalFiled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                }`}>
                  {isLocalFiled ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />}
                  <span>{isLocalFiled ? 'PAID & FILED' : 'REMITTANCE DUE'}</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Local EIT & LST Taxes</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Local Collector • Act 32 PSD Return</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Local Due</span>
                <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {fmt(totalLocalLiability)}
                </span>
              </div>

              <div className="space-y-1 pt-1 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
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
                    <Calendar className="w-3.5 h-3.5 text-purple-500" />
                    <span>Payment Due Date:</span>
                  </span>
                  <span className={`font-mono font-bold ${isLocalFiled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {isLocalFiled ? `Paid (${localTask?.filedDate || 'Filed'})` : (localTask?.dueDate || '2026-10-31')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('COMPLIANCE')}
              className="w-full py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isLocalFiled ? 'View Paid Filing' : 'Pay Local Collector'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
            </button>
          </div>

        </div>

        {/* Overall Tax Liability Summary Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-900/50">
          <div>
            <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block">Combined Total Tax Liability Due (Federal + State + Local)</span>
            <span className="text-2xl font-black font-mono text-emerald-400">
              {fmt(totalTaxLiabilityAll)}
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Live breakdown computed from issued employee paystubs in Tax Year {data.activeTaxYear}.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('COMPLIANCE')}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Tax Remittance Hub</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div 
          onClick={() => onNavigateTab('EXPENSES')}
          className="glass-card p-6 rounded-2xl cursor-pointer hover:border-indigo-500/50 group transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Expenses & Receipts</h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Log vendor receipts, map expenses to Schedule C lines, and maintain audit-proof documentation.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('PAYROLL')}
          className="glass-card p-6 rounded-2xl cursor-pointer hover:border-indigo-500/50 group transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Payroll & Taxes</h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Run PA state (3.07%), local EIT/LST, and W-4 federal tax withholding with immutable calculation snapshots.
          </p>
        </div>

        <div 
          onClick={() => onNavigateTab('EXPORT')}
          className="glass-card p-6 rounded-2xl cursor-pointer hover:border-indigo-500/50 group transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Accountant Export</h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Generate CSV, Excel spreadsheets, and year-end packages for your CPA tax return.
          </p>
        </div>
      </div>
    </div>
  );
}
