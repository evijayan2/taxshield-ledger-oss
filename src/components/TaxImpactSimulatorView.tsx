import React, { useState } from 'react';
import { Company, TaxSimulationScenario, simulateTaxImpact, getActiveRates } from 'taxshield-ledger-core';
import { 
  Sliders, 
  DollarSign, 
  Calendar, 
  TrendingDown, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  AlertCircle, 
  HelpCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Info,
  MapPin
} from 'lucide-react';
import { getSupportedStateByCode } from '../utils/supportedStates';

interface Props {
  company?: Company;
}

export const TaxImpactSimulatorView: React.FC<Props> = ({ company }) => {
  // Strictly derive company jurisdiction states from company address history & primary address
  const currentCompanyState = (company?.state || 'PA').trim().toUpperCase();
  const addressHistoryStates = (company?.addressHistory || [])
    .map((addr) => addr.state?.trim().toUpperCase())
    .filter(Boolean) as string[];

  const companyAddressStates = Array.from(new Set([currentCompanyState, ...addressHistoryStates]));
  const [selectedState, setSelectedState] = useState<string>(currentCompanyState);

  const stateOptions = companyAddressStates.map((code) => {
    const meta = getSupportedStateByCode(code);
    return {
      code,
      name: meta ? meta.name : code,
      isPrimary: code === currentCompanyState,
    };
  });

  // Helper to resolve state income tax rate dynamically based on chosen state
  const resolveStateTaxRate = (stCode: string): number => {
    const code = stCode.trim().toUpperCase();
    const noTaxStates = ['TX', 'FL', 'NV', 'WA', 'TN', 'WY', 'SD', 'AK'];
    if (noTaxStates.includes(code)) return 0.0;

    if (code === 'PA') {
      try {
        const rates = getActiveRates();
        if (rates && typeof rates.paSitRate === 'number') return rates.paSitRate;
      } catch (err) {
        console.warn('Dynamic state SIT rate fallback:', err);
      }
      return 0.0307;
    }

    if (code === 'DE') return 0.045;
    if (code === 'NJ') return 0.055;
    if (code === 'NY') return 0.055;
    if (code === 'OH') return 0.0325;
    if (code === 'CA') return 0.06;
    if (code === 'VA' || code === 'MD' || code === 'NC' || code === 'GA') return 0.05;
    return 0.045; // Default average state SIT for other states
  };

  const activeStateRate = resolveStateTaxRate(selectedState);

  // Starts fresh with 0 default revenue/expense values (user inputs actual business parameters)
  const [scenario, setScenario] = useState<TaxSimulationScenario>({
    ownerTaxBracketPercent: company?.ownerTaxBracket || 24,
    grossRevenue: 0,
    ownerW2Salary: 0,
    ownerDraws: 0,
    section179AssetExpense: 0,
    homeOfficeMethod: 'SIMPLIFIED',
    otherDeductibleExpenses: 0,
  });

  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [scheduleMode, setScheduleMode] = useState<'QUARTERLY' | 'MONTHLY'>('MONTHLY');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  let result;
  try {
    result = simulateTaxImpact(scenario, activeStateRate);
  } catch (err) {
    console.error('Error executing tax impact simulation:', err);
  }

  if (!result) {
    return (
      <div className="p-6">
        <div className="glass-panel p-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-base">Tax Simulator Unavailable</h3>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Unable to calculate tax simulation. Please verify active tax rules in the Tax Rules Engine.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isZeroRevenueLoss = scenario.grossRevenue === 0;
  const totalBusinessLoss = Math.max(0, (scenario.ownerW2Salary + scenario.section179AssetExpense + scenario.otherDeductibleExpenses) - scenario.grossRevenue);

  const getStatePortalTip = (stCode: string) => {
    const code = stCode.trim().toUpperCase();
    if (code === 'PA') return 'Monthly depositors remit PA state income tax withholding via PA myPATH and federal withholding via EFTPS by the 15th of each month following payroll.';
    if (code === 'NJ') return 'Monthly depositors remit NJ Gross Income Tax withholding via NJ Premier Business Services and federal withholding via EFTPS.';
    if (code === 'NY') return 'Monthly depositors remit NY State income tax withholding via NY Tax Online Services for Business and federal withholding via EFTPS.';
    if (code === 'DE') return 'Monthly depositors remit DE State income tax withholding via Delaware One Stop and federal withholding via EFTPS.';
    if (code === 'OH') return 'Monthly depositors remit OH Personal income tax withholding via Ohio Business Gateway and federal withholding via EFTPS.';
    if (['TX', 'FL', 'NV', 'WA', 'TN', 'WY', 'SD', 'AK'].includes(code)) return `${code} has no state personal income tax. Monthly tax deposits apply only to federal tax withholding via EFTPS.`;
    return `Monthly depositors remit ${code} state income tax withholding via ${code} State Tax Portal and federal withholding via EFTPS.`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Phase 2 Advanced Simulator
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Form 1040, Schedule SE, QBI 20% & 1040-ES ({selectedState})
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Advanced Tax Impact Simulator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive scenario modeling for Owner W-2 Salary vs Draw split, Section 179 asset purchases, Section 199A QBI deduction, and quarterly 1040-ES payment schedules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{showGuide ? 'Hide Guide' : 'Show Tax Guide'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-right">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {scenario.grossRevenue === 0 && scenario.ownerW2Salary > 0 ? 'Effective Rate (W-2 Salary)' : 'Effective Tax Rate'}
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {result.effectiveTaxRatePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* On-Screen Interactive Help & Guide Panel (Quiet Neutral Theme) */}
        {showGuide && (
          <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100">On-Screen Tax Guide & Plain-English Explainer</h3>
              </div>
              <span className="text-[10px] font-medium uppercase bg-slate-200/80 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                {selectedState} Tax Rules
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/70 space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <span>1. Business Loss vs Out-of-Pocket</span>
                </h4>
                <div className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  {isZeroRevenueLoss && totalBusinessLoss > 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-[11px] leading-snug">
                      Active Net Operating Loss (-${totalBusinessLoss.toLocaleString()}): Your $0 revenue with ${totalBusinessLoss.toLocaleString()} expenses creates a business loss. This loss flows to Form 1040 and can REDUCE overall personal taxes!
                    </div>
                  ) : (
                    'Operating expenses and W-2 salaries reduce net profit. In a loss year, business losses flow through to Form 1040 Schedule C/E to offset other personal income.'
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/70 space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <span>2. W-2 Salary vs Owner Draw</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  Paying an owner a W-2 salary creates a business expense deduction, but generates personal W-2 taxable income. Owner draws are non-taxable distributions of already-taxed profit.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/70 space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <span>3. Form 1040-ES Vouchers</span>
                </h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  Quarterly vouchers show tax due if not withheld on paychecks. If payroll tax withholding is active on your W-2 paychecks, quarterly vouchers are satisfied automatically!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview Stat Cards */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Net Business Profit
              </span>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'profit' ? null : 'profit')}
                title="Explain Net Business Profit"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              ${result.netBusinessProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            {activeTooltip === 'profit' && (
              <div className="mt-2 p-2 rounded-lg bg-slate-900 text-slate-900 dark:text-white dark:bg-slate-800 border border-slate-700 text-[11px] leading-tight">
                Gross Revenue minus total deductible expenses. Subject to Schedule C / Self-Employment Tax.
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Section 199A QBI Deduction
              </span>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'qbi' ? null : 'qbi')}
                title="Explain Section 199A QBI"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              ${result.qbiDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            {activeTooltip === 'qbi' && (
              <div className="mt-2 p-2 rounded-lg bg-slate-900 text-slate-900 dark:text-white dark:bg-slate-800 border border-slate-700 text-[11px] leading-tight">
                20% IRS tax deduction on qualified pass-through net business profit (Form 1040 line 13).
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Self-Employment Tax (SE)
              </span>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'se' ? null : 'se')}
                title="Explain Self-Employment Tax"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              ${result.selfEmploymentTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            {activeTooltip === 'se' && (
              <div className="mt-2 p-2 rounded-lg bg-slate-900 text-slate-900 dark:text-white dark:bg-slate-800 border border-slate-700 text-[11px] leading-tight">
                15.3% Social Security & Medicare tax on Schedule C net business profit (for sole props / single-member LLCs).
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Tax Liability
              </span>
              <button
                onClick={() => setActiveTooltip(activeTooltip === 'liability' ? null : 'liability')}
                title="Explain Total Tax Liability"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              ${result.totalTaxLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            {activeTooltip === 'liability' && (
              <div className="mt-2 p-2 rounded-lg bg-slate-900 text-slate-900 dark:text-white dark:bg-slate-800 border border-slate-700 text-[11px] leading-tight">
                Combined federal, state, and payroll taxes owed on personal W-2 salary and business profit combined.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Sliders & Quarterly 1040-ES Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Interactive Scenario Controls */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>Scenario Parameters</span>
              <span className="text-[10px] font-normal text-slate-400">(Drag slider or type exact amount)</span>
            </span>
            <Sliders className="w-4 h-4 text-slate-400" />
          </h3>

          {/* Company / Jurisdiction State Picker (Derived strictly from Company Address History) */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Company Tax Jurisdiction State</span>
                <span className="text-[10px] text-slate-400" title="State personal income tax (SIT) jurisdiction derived from Company Address History.">ⓘ</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                SIT Rate: {(activeStateRate * 100).toFixed(2)}%
              </span>
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-2.5 py-1.5 font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-slate-400 text-xs cursor-pointer"
            >
              {stateOptions.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name} ({st.code}) {st.isPrimary ? '— Primary Company Address' : '— Address History'}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              * Options derived strictly from company address history records.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Gross Business Revenue ($)</span>
                <span className="text-[10px] text-slate-400" title="Total sales/income received from customers">ⓘ</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="1000"
                  value={scenario.grossRevenue}
                  onChange={(e) => setScenario({ ...scenario, grossRevenue: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-24 px-2 py-1 text-right font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-slate-400 text-xs font-mono"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="500000"
              step="2500"
              value={scenario.grossRevenue}
              onChange={(e) => setScenario({ ...scenario, grossRevenue: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-700 dark:accent-slate-300"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Owner W-2 Reasonable Salary ($)</span>
                <span className="text-[10px] text-slate-400" title="Wages paid to owner as W-2 employee. Deductible business expense, taxable personal income.">ⓘ</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  max="300000"
                  step="1000"
                  value={scenario.ownerW2Salary}
                  onChange={(e) => setScenario({ ...scenario, ownerW2Salary: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-24 px-2 py-1 text-right font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-slate-400 text-xs font-mono"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="2500"
              value={scenario.ownerW2Salary}
              onChange={(e) => setScenario({ ...scenario, ownerW2Salary: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-700 dark:accent-slate-300"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Section 179 Asset Purchase Expense ($)</span>
                <span className="text-[10px] text-slate-400" title="Immediate 100% tax write-off for equipment, vehicle, computer purchases">ⓘ</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  step="1000"
                  value={scenario.section179AssetExpense}
                  onChange={(e) => setScenario({ ...scenario, section179AssetExpense: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-24 px-2 py-1 text-right font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-slate-400 text-xs font-mono"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={scenario.section179AssetExpense}
              onChange={(e) => setScenario({ ...scenario, section179AssetExpense: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-700 dark:accent-slate-300"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Other Deductible Business Expenses ($)</span>
                <span className="text-[10px] text-slate-400" title="Rent, supplies, software, advertising, legal fees">ⓘ</span>
              </span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  step="1000"
                  value={scenario.otherDeductibleExpenses}
                  onChange={(e) => setScenario({ ...scenario, otherDeductibleExpenses: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-24 px-2 py-1 text-right font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-slate-400 text-xs font-mono"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={scenario.otherDeductibleExpenses}
              onChange={(e) => setScenario({ ...scenario, otherDeductibleExpenses: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-700 dark:accent-slate-300"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Owner Marginal Tax Bracket (%)</span>
                <span className="text-[10px] text-slate-400" title="Form 1040 federal tax bracket (10%, 12%, 22%, 24%, 32%, 35%, 37%)">ⓘ</span>
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="10"
                  max="37"
                  step="1"
                  value={scenario.ownerTaxBracketPercent}
                  onChange={(e) => setScenario({ ...scenario, ownerTaxBracketPercent: Math.max(10, Math.min(37, Number(e.target.value) || 10)) })}
                  className="w-16 px-2 py-1 text-right font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-slate-400 text-xs font-mono"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="37"
              step="1"
              value={scenario.ownerTaxBracketPercent}
              onChange={(e) => setScenario({ ...scenario, ownerTaxBracketPercent: Number(e.target.value) || 0 })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-700 dark:accent-slate-300"
            />
          </div>
        </div>

        {/* Tax Filing Schedule Card: Monthly & Quarterly Toggle */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{scheduleMode === 'MONTHLY' ? `${selectedState} Monthly Tax Filing Schedule` : `Form 1040-ES Quarterly Schedule (${selectedState})`}</span>
            </h3>
            
            {/* Mode Switcher Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setScheduleMode('MONTHLY')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  scheduleMode === 'MONTHLY'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly (12)
              </button>
              <button
                onClick={() => setScheduleMode('QUARTERLY')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  scheduleMode === 'QUARTERLY'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Quarterly (4)
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {scheduleMode === 'MONTHLY'
              ? `Monthly tax deposit schedule for ${selectedState} SIT & federal withholding reserve.`
              : `Estimated quarterly tax payment vouchers required for ${selectedState} & federal underpayment prevention.`}
          </p>

          {scheduleMode === 'MONTHLY' ? (
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Monthly Tax Reserve:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ${(result.monthlyFilingSchedule?.[0]?.amount || Math.round((result.totalTaxLiability / 12) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} / mo
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto pr-1 space-y-2 text-xs">
                {(result.monthlyFilingSchedule || []).map((m) => (
                  <div
                    key={m.monthNumber}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {m.month}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Due Date: {m.dueDate}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white font-mono block">
                        ${m.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {activeStateRate === 0
                          ? `${selectedState}: No SIT ($0.00) | Fed: $${m.federalAmount.toFixed(2)}`
                          : `${selectedState} SIT: $${m.paSitAmount.toFixed(2)} | Fed: $${m.federalAmount.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(result.estimatedPaymentDates || []).map((q) => (
                <div
                  key={q.quarter}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {q.quarter}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Due: {q.dueDate}
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    ${q.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-slate-200 block">
              {scheduleMode === 'MONTHLY' ? '🗓️ Monthly Filing Tip:' : '💡 Quarterly Voucher Tip:'}
            </span>
            <p className="text-[11px] leading-relaxed">
              {scheduleMode === 'MONTHLY'
                ? getStatePortalTip(selectedState)
                : 'If your business runs active W-2 payroll with tax withholdings on paychecks, these 1040-ES quarterly vouchers are already remitted automatically. Vouchers are only paid manually if tax is not withheld at the source.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
