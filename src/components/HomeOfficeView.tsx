import React, { useState } from 'react';
import { Company, HomeOfficeExpense } from 'taxshield-ledger-core';
import { calculateHomeOfficeDeduction } from 'taxshield-ledger-core';
import { Home, Calculator, DollarSign, CheckCircle2, Info, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  company: Company;
}

export const HomeOfficeView: React.FC<Props> = ({ company }) => {
  // Starts fresh with 0 default expense amounts (user inputs actual home office parameters)
  const [expense, setExpense] = useState<HomeOfficeExpense>({
    id: 'ho-2026',
    companyId: company.id,
    taxYearId: 'ty-2026',
    calculationMethod: 'SIMPLIFIED',
    totalHomeSquareFeet: 0,
    officeSquareFeet: 0,
    mortgageInterest: 0,
    realEstateTaxes: 0,
    homeInsurance: 0,
    utilities: 0,
    rent: 0,
    repairsMaintenance: 0,
    otherDirectExpenses: 0,
    otherIndirectExpenses: 0,
  });

  const [netBusinessIncome, setNetBusinessIncome] = useState<number>(0);

  const result = calculateHomeOfficeDeduction(expense, netBusinessIncome);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Form 8829 & Schedule C Line 30
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                IRS Business Use of Home
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Home Office Deduction Module
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Calculate and compare the Simplified Method ($5/sq ft) against the Actual Expense Method (Form 8829).
            </p>
          </div>

          <div className="flex w-full sm:w-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setExpense({ ...expense, calculationMethod: 'SIMPLIFIED' })}
              className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                expense.calculationMethod === 'SIMPLIFIED'
                  ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-md shadow-emerald-700/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Simplified Method
            </button>
            <button
              onClick={() => setExpense({ ...expense, calculationMethod: 'ACTUAL' })}
              className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                expense.calculationMethod === 'ACTUAL'
                  ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-md shadow-emerald-700/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Actual Expense (Form 8829)
            </button>
          </div>
        </div>

        {/* Dual Method Comparison Banner */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className={`glass-card p-5 rounded-2xl border transition-all ${
              expense.calculationMethod === 'SIMPLIFIED'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Simplified Method
              </span>
              {result.recommendedMethod === 'SIMPLIFIED' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Recommended
                </span>
              )}
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-2">
              ${result.simplifiedDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              $5.00 / sq ft on {Math.min(300, result.officeSquareFeet)} qualifying sq ft (capped at 300 sq ft = $1,500 max).
            </p>
          </div>

          <div
            className={`glass-card p-5 rounded-2xl border transition-all ${
              expense.calculationMethod === 'ACTUAL'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actual Expense (Form 8829)
              </span>
              {result.recommendedMethod === 'ACTUAL' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  Recommended
                </span>
              )}
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-2">
              ${result.actualTotalDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {result.businessPercentage}% business allocation of housing costs plus direct expenses.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Schedule C Line 30 Output
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-2">
              ${result.scheduleCLine30Amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Final deductible amount passed directly to your Schedule C business tax calculation.
            </p>
          </div>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Square Footage & Housing Expenses Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Home Office Parameters
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Total Home Sq Ft
              </label>
              <input
                type="number"
                value={expense.totalHomeSquareFeet}
                onChange={(e) => setExpense({ ...expense, totalHomeSquareFeet: parseFloat(e.target.value) || 0 })}
                className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Dedicated Office Sq Ft
              </label>
              <input
                type="number"
                value={expense.officeSquareFeet}
                onChange={(e) => setExpense({ ...expense, officeSquareFeet: parseFloat(e.target.value) || 0 })}
                className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs flex items-center justify-between">
            <span className="text-slate-800 dark:text-slate-200 font-semibold">
              Business Allocation Percentage:
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {result.businessPercentage}%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Annual Housing Expenses (Form 8829)
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Mortgage Interest ($)</label>
                <input
                  type="number"
                  value={expense.mortgageInterest}
                  onChange={(e) => setExpense({ ...expense, mortgageInterest: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-input px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Real Estate Taxes ($)</label>
                <input
                  type="number"
                  value={expense.realEstateTaxes}
                  onChange={(e) => setExpense({ ...expense, realEstateTaxes: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-input px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Home Insurance ($)</label>
                <input
                  type="number"
                  value={expense.homeInsurance}
                  onChange={(e) => setExpense({ ...expense, homeInsurance: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-input px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Utilities ($)</label>
                <input
                  type="number"
                  value={expense.utilities}
                  onChange={(e) => setExpense({ ...expense, utilities: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-input px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Rent Paid ($)</label>
                <input
                  type="number"
                  value={expense.rent}
                  onChange={(e) => setExpense({ ...expense, rent: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-input px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Repairs & Maintenance ($)</label>
                <input
                  type="number"
                  value={expense.repairsMaintenance}
                  onChange={(e) => setExpense({ ...expense, repairsMaintenance: parseFloat(e.target.value) || 0 })}
                  className="w-full glass-input px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form 8829 Breakdown & Net Income Limit Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Form 8829 Deduction Breakdown
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Total Indirect Expenses:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono">
                ${result.actualIndirectExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Allocated Indirect ({result.businessPercentage}%):</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono">
                ${result.allocatedIndirectExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Direct Office Expenses:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono">
                ${result.actualDirectExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between py-2 font-bold text-sm text-slate-900 dark:text-white pt-2">
              <span>Total Actual Form 8829 Deduction:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                ${result.actualTotalDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Net Schedule C Business Profit Before Home Office ($)
            </label>
            <input
              type="number"
              value={netBusinessIncome}
              onChange={(e) => setNetBusinessIncome(parseFloat(e.target.value) || 0)}
              className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              IRS Section 280A limits home office deductions to net business income before the deduction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
