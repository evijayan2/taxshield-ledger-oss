import React from 'react';
import { 
  Building2, 
  Users, 
  Car, 
  Calculator, 
  Landmark, 
  TrendingDown, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { Organization, Employee, MileageLog, PayrollRun, ComplianceTask } from '../types';

export type StepId = 'STEP_ORG' | 'STEP_EMPLOYEES' | 'STEP_MILEAGE' | 'STEP_PAYROLL' | 'STEP_COMPLIANCE' | 'STEP_SIMULATOR';

interface StepWorkflowBannerProps {
  currentStep: StepId;
  onSelectStep: (step: StepId) => void;
  org: Organization;
  employees: Employee[];
  mileageLogs: MileageLog[];
  payrollRuns: PayrollRun[];
  complianceTasks: ComplianceTask[];
}

export function StepWorkflowBanner({
  currentStep,
  onSelectStep,
  org,
  employees,
  mileageLogs,
  payrollRuns,
  complianceTasks
}: StepWorkflowBannerProps) {
  const steps: {
    id: StepId;
    stepNumber: number;
    title: string;
    shortDesc: string;
    icon: React.ElementType;
    isComplete: boolean;
    stat: string;
  }[] = [
    {
      id: 'STEP_ORG',
      stepNumber: 1,
      title: 'LLC Entity & Tax Setup',
      shortDesc: 'EIN & PA Account ID',
      icon: Building2,
      isComplete: Boolean(org.ein && org.stateTaxId && org.name),
      stat: org.ein ? `EIN: ${org.ein}` : 'Needs Setup'
    },
    {
      id: 'STEP_EMPLOYEES',
      stepNumber: 2,
      title: 'Staff & PSD Rates',
      shortDesc: 'W-4 & Local EIT PSDs',
      icon: Users,
      isComplete: employees.length > 0,
      stat: `${employees.length} Employee${employees.length === 1 ? '' : 's'}`
    },
    {
      id: 'STEP_MILEAGE',
      stepNumber: 3,
      title: '5-Point Mileage & Travel',
      shortDesc: 'IRS Odometer & Tolls',
      icon: Car,
      isComplete: mileageLogs.length > 0,
      stat: `${mileageLogs.length} Trip${mileageLogs.length === 1 ? '' : 's'} Logged`
    },
    {
      id: 'STEP_PAYROLL',
      stepNumber: 4,
      title: 'Assisted Payroll & ACH',
      shortDesc: 'PA 3.07% & Stubs',
      icon: Calculator,
      isComplete: payrollRuns.length > 0,
      stat: `${payrollRuns.length} Run${payrollRuns.length === 1 ? '' : 's'} Locked`
    },
    {
      id: 'STEP_COMPLIANCE',
      stepNumber: 5,
      title: 'Tax Compliance Filings',
      shortDesc: 'PA myPATH & Form 941',
      icon: Landmark,
      isComplete: complianceTasks.some(t => t.status === 'FILED'),
      stat: `${complianceTasks.filter(t => t.status === 'FILED').length}/${complianceTasks.length} Filed`
    },
    {
      id: 'STEP_SIMULATOR',
      stepNumber: 6,
      title: 'Pass-Through Strategy',
      shortDesc: 'Form 1040 Schedule C',
      icon: TrendingDown,
      isComplete: true,
      stat: `${org.ownerTaxBracket}% Marginal`
    }
  ];

  const currentIdx = steps.findIndex(s => s.id === currentStep);
  const completedCount = steps.filter(s => s.isComplete).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const handleNext = () => {
    if (currentIdx < steps.length - 1) {
      onSelectStep(steps[currentIdx + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      onSelectStep(steps[currentIdx - 1].id);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-sm mb-6 transition-colors">
      {/* Top Header: Step Overview & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Step-by-Step Workflow
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Step {currentIdx + 1} of {steps.length}: <strong className="text-slate-900 dark:text-white">{steps[currentIdx].title}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Seamless end-to-end execution for Pennsylvania Micro-LLC compliance and zero-cost tax filing.
          </p>
        </div>

        {/* Progress Bar & Next/Prev Controls */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{progressPct}% Complete</span>
            <div className="w-28 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Previous Step"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              disabled={currentIdx === steps.length - 1}
              className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Next Step"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Step Pills Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          return (
            <button
              key={step.id}
              onClick={() => onSelectStep(step.id)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isActive 
                    ? 'bg-emerald-600 text-white' 
                    : step.isComplete 
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {step.isComplete ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : step.stepNumber}
                </div>
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              </div>

              <div>
                <h4 className={`text-xs font-bold truncate ${isActive ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                  {step.title}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {step.stat}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
