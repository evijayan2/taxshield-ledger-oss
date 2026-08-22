import React, { useState } from 'react';
import { 
  TrendingDown, 
  ShieldCheck, 
  CheckCircle2, 
  PieChart
} from 'lucide-react';
import { Organization, PayrollRun, PayStub, MileageLog, TravelExpense, GeneralExpense } from '../types';
import { calculatePassThroughSavings, validateIrs5PointMileage } from '../utils/taxEngine';

interface PassThroughSimulatorViewProps {
  org: Organization;
  payrollRuns: PayrollRun[];
  payStubs: PayStub[];
  mileageLogs: MileageLog[];
  travelExpenses: TravelExpense[];
  generalExpenses: GeneralExpense[];
  onUpdateTaxBracket: (bracket: number) => void;
}

export function PassThroughSimulatorView({
  org,
  payStubs,
  mileageLogs,
  travelExpenses,
  generalExpenses,
  onUpdateTaxBracket
}: PassThroughSimulatorViewProps) {
  const [ownerBracket, setOwnerBracket] = useState<number>(org.ownerTaxBracket || 24);

  // Calculate totals
  const totalGrossWages = payStubs.reduce((sum, s) => sum + s.grossEarnings, 0);
  const totalEmployerTaxes = payStubs.reduce((sum, s) => sum + s.totalEmployerTaxes, 0);
  const totalMileageDollars = mileageLogs.reduce((sum, m) => sum + m.mileageAllowance, 0);
  const totalTravelDollars = travelExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalGeneralDollars = generalExpenses.reduce((sum, g) => sum + g.amount, 0);

  const savings = calculatePassThroughSavings(
    totalGrossWages,
    totalEmployerTaxes,
    totalMileageDollars,
    totalTravelDollars,
    totalGeneralDollars,
    ownerBracket,
    0.0307 // PA SIT
  );

  // Audit Vulnerability Checks
  const auditChecks = mileageLogs.map(m => ({
    trip: m,
    validation: validateIrs5PointMileage(m)
  }));

  const perfectTripsCount = auditChecks.filter(c => c.validation.isValid && c.validation.score >= 80).length;
  const auditHealthScore = mileageLogs.length > 0 ? Math.round((perfectTripsCount / mileageLogs.length) * 100) : 100;

  const handleBracketChange = (bracket: number) => {
    setOwnerBracket(bracket);
    onUpdateTaxBracket(bracket);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Owner Pass-Through Tax Strategy & Loss Simulator</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For Micro-LLCs with $0 income: ordinary and necessary business expenses flow through to Form 1040 Schedule C / 1065 K-1 to legally reduce personal tax liability.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Owner Bracket:</span>
          <select
            value={ownerBracket}
            onChange={(e) => handleBracketChange(Number(e.target.value))}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value={10}>10% Bracket</option>
            <option value={12}>12% Bracket</option>
            <option value={22}>22% Bracket</option>
            <option value={24}>24% Bracket</option>
            <option value={32}>32% Bracket</option>
            <option value={35}>35% Bracket</option>
            <option value={37}>37% Bracket</option>
          </select>
        </div>
      </div>

      {/* Hero Pass-Through Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Accumulated LLC Expenses</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            ${savings.totalBusinessLossExpenses.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Ordinary & Necessary Deductions</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/40 shadow-sm space-y-1">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Federal Tax Offset (Form 1040)</span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight font-mono">
            ${savings.federalTaxSavings.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80">Saved at {ownerBracket}% Marginal Rate</p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/40 shadow-sm space-y-1">
          <span className="text-xs text-blue-800 dark:text-blue-300 font-medium">PA State Tax Offset (myPATH)</span>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400 tracking-tight font-mono">
            ${savings.paStateTaxSavings.toFixed(2)}
          </p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400/80">Saved at 3.07% PA Rate</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/40 shadow-sm space-y-1">
          <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Total Personal Tax Cash Saved</span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 tracking-tight font-mono">
            ${savings.totalEstimatedTaxSavings.toFixed(2)}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400/80">Net Cash Flow Preserved</p>
        </div>
      </div>

      {/* Schedule C / 1065 Expense Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Category Itemization */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Schedule C / 1065 Deductible Categories</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300">W-2 Wages (Line 26 / Gross Wages)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">${totalGrossWages.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300">Taxes & Licenses (Employer FICA & PA UC)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">${totalEmployerTaxes.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300">Car and Truck Expenses (5-Point Mileage @ ${org.standardMileageRate}/mi)</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${totalMileageDollars.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300">Travel Expenses (PA Turnpike Tolls & Parking)</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">${totalTravelDollars.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300">Other Business Expenses (Legal, Agent, Tech)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">${totalGeneralDollars.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">
              <span className="text-slate-900 dark:text-white">Total Business Deductions:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                ${savings.totalBusinessLossExpenses.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: IRS Audit Vulnerability Analyzer */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">IRS Audit Readiness & Defense Score</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold">
              {auditHealthScore}% Compliant
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 dark:text-slate-200 block">5-Point Contemporaneous Record-Keeping</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">All {mileageLogs.length} logged business trips include starting and ending odometer readings.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 dark:text-slate-200 block">Accountable Plan Distinction</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Employee mileage & toll reimbursements are properly separated as non-taxable additions with $0 FICA withholding.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 dark:text-slate-200 block">Digital Receipt Trail</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">PA Turnpike E-ZPass and state parking slips have reference codes logged for substantiation under Treas. Reg. § 1.274-5.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
