import React, { useState } from 'react';
import { Company, Employee, NewYearRolloverStep, NewYearRolloverSummary } from 'taxshield-ledger-core';
import { processNewYearRollover } from 'taxshield-ledger-core';
import { X, Calendar, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  employees: Employee[];
}

export const NewYearRolloverDrawer: React.FC<Props> = ({ isOpen, onClose, company, employees }) => {
  const currentYear = new Date().getFullYear();
  const [targetYear, setTargetYear] = useState<number>(currentYear + 1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rolloverResult, setRolloverResult] = useState<{
    summary: NewYearRolloverSummary;
    steps: NewYearRolloverStep[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartRollover = () => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = processNewYearRollover(company, employees, currentYear, targetYear);
      setRolloverResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete tax year rollover.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex pl-10">
        <div className="w-full glass-panel bg-white/95 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                  Annual Rollover Wizard
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                New-Year Setup & Rule Activation
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {!rolloverResult ? (
              <div className="space-y-6">
                <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Target Tax Year
                  </label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(parseInt(e.target.value, 10))}
                    className="w-full glass-input px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={currentYear + 1}>Tax Year {currentYear + 1}</option>
                    <option value={currentYear + 2}>Tax Year {currentYear + 2}</option>
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Guided annual rollover creates fiscal calendar periods, audits roster locations, inspects sealed tax packages, runs regression tests, and activates statutory rules.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    5-Step Rollover Sequence
                  </h3>
                  {[
                    { step: 1, name: 'Tax Year & Fiscal Calendar Initialization' },
                    { step: 2, name: 'Employee Roster & Address Verification' },
                    { step: 3, name: 'Jurisdiction Resolution & Coverage Audit' },
                    { step: 4, name: 'Tax Package Ingestion & Rule Diff Inspection' },
                    { step: 5, name: 'Regression Test Harness & Rule Activation' },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/30 flex items-center gap-3 text-xs"
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
                        {s.step}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {s.name}
                      </span>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Tax Year {rolloverResult.summary.toYear} Rollover Complete
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    Generated {rolloverResult.summary.calendarPeriodsGenerated} published payroll calendar periods and activated {rolloverResult.summary.rulesActivated} statutory tax rules.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Rollover Execution Log
                  </h3>
                  {rolloverResult.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 dark:text-white">
                          Step {step.stepNumber}: {step.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            step.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {step.description}
                      </p>
                      {step.details && (
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                          {step.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {rolloverResult ? 'Close' : 'Cancel'}
            </button>
            {!rolloverResult && (
              <button
                onClick={handleStartRollover}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow transition-colors"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing Rollover...
                  </>
                ) : (
                  <>
                    Run Rollover Wizard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
