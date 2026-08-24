import React, { useState } from 'react';
import { Calendar, ShieldCheck, Landmark, Sparkles, X, AlertCircle, Lock } from 'lucide-react';
import { TaxYear } from '../types';
import { isFutureYear } from '../utils/taxEngine';

interface TaxYearSetupModalProps {
  isOpen: boolean;
  activeYear?: number;
  existingYears?: TaxYear[];
  onSave: (year: number) => void;
  onClose: () => void;
}

export const TaxYearSetupModal: React.FC<TaxYearSetupModalProps> = ({
  isOpen,
  activeYear = 2026,
  existingYears = [],
  onSave,
  onClose,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(activeYear);
  const [taxClassification, setTaxClassification] = useState<string>('DISREGARDED_SINGLE_MEMBER');
  const [jurisdictionFederal, setJurisdictionFederal] = useState(true);
  const [jurisdictionPA, setJurisdictionPA] = useState(true);
  const [jurisdictionLocalPA, setJurisdictionLocalPA] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear || selectedYear < 2000 || selectedYear > 2100) {
      setError('Please select a valid 4-digit tax year (e.g. 2026).');
      return;
    }

    setError(null);
    onSave(Number(selectedYear));
    onClose();
  };

  const isAlreadyCreated = existingYears.some(ty => ty.year === selectedYear);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full flex">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
                <Calendar className="w-6 h-6 text-indigo-200" />
              </div>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  Tax Year Setup & Configuration
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                </h2>
                <p className="text-xs text-indigo-100">
                  Initialize first-class tax rules, filing cycles, & jurisdiction models
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-indigo-100 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-slate-900 dark:text-slate-100 flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Year Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Target Tax Year
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value, 10) || 2026)}
                  className="w-36 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  {[2025, 2026, 2027].map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedYear(yr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        selectedYear === yr
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
              {isAlreadyCreated && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Tax Year {selectedYear} is already initialized in your ledger. Saving will update its configuration.
                </p>
              )}
              {isFutureYear(selectedYear) && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-start gap-2 mt-2">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Future Tax Year Notice:</strong> Initializing Tax Year {selectedYear} configures jurisdiction parameters, but adding expenses, timesheets, mileage, payroll runs, or filing returns will remain locked until tax year {selectedYear} begins.
                  </span>
                </div>
              )}
            </div>

            {/* Tax Entity Classification */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                LLC Tax Classification ({selectedYear})
              </label>
              <select
                value={taxClassification}
                onChange={e => setTaxClassification(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="DISREGARDED_SINGLE_MEMBER">Single-Member Disregarded LLC (Schedule C Pass-Through)</option>
                <option value="S_CORP_ELECTION">S-Corporation Election (Form 1120-S + W-2 Officer Salary)</option>
                <option value="PARTNERSHIP">Multi-Member Partnership (Form 1065)</option>
              </select>
            </div>

            {/* Attached Jurisdictions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-indigo-500" />
                  Attached Tax Jurisdictions ({selectedYear})
                </label>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
                  Auto-Resolving Rules
                </span>
              </div>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                  <input
                    type="checkbox"
                    checked={jurisdictionFederal}
                    onChange={e => setJurisdictionFederal(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">US-FEDERAL (Internal Revenue Service)</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">Required</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pub 15-T Federal Withholding, FICA Social Security (6.2%), Medicare (1.45%), IRS Mileage Rate ($0.67/mi).
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                  <input
                    type="checkbox"
                    checked={jurisdictionPA}
                    onChange={e => setJurisdictionPA(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">PA-STATE (Pennsylvania Dept. of Revenue & L&I)</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">State SIT / UC</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      PA State Income Tax (3.07% flat rate), Employer UC Tax (3.822% base rate), Form REV-1667 & UC-2 filing calendars.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                  <input
                    type="checkbox"
                    checked={jurisdictionLocalPA}
                    onChange={e => setJurisdictionLocalPA(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">PA-LOCAL (PSD Municipality & EIT / LST Taxing District)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Act 32 Earned Income Tax (EIT 1.0% resident rate) and Local Services Tax ($52/yr LST withholding).
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                Initialize Tax Year {selectedYear}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
