import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Employee } from '../../types';

interface StaffW4TabProps {
  formData: Omit<Employee, 'id'>;
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  onChange: (field: keyof Omit<Employee, 'id'>, value: any) => void;
  onBlur: (field: keyof Omit<Employee, 'id'>) => void;
}

/**
 * Tab component for IRS Form W-4 federal income tax withholding configuration with inline focus-out validation.
 */
export function StaffW4Tab({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
}: StaffW4TabProps) {
  const getInputClass = (field: keyof Omit<Employee, 'id'>, extraClasses: string = '') => {
    const hasError = Boolean(touched[field] && errors[field]);
    const borderClass = hasError
      ? 'border-rose-500 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20';
    return `w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-3 py-2 text-slate-900 dark:text-white transition focus:outline-none focus:ring-2 ${borderClass} ${extraClasses}`;
  };

  const renderInlineError = (field: keyof Omit<Employee, 'id'>) => {
    if (!touched[field] || !errors[field]) return null;
    return (
      <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium animate-in fade-in duration-200">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {errors[field]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Step 1: Filing Status</label>
          <select
            value={formData.w4FilingStatus || 'SINGLE'}
            onChange={(e) => onChange('w4FilingStatus', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium"
          >
            <option value="SINGLE">Single or Married filing separately</option>
            <option value="MARRIED_FILING_JOINTLY">Married filing jointly</option>
            <option value="HEAD_OF_HOUSEHOLD">Head of household</option>
          </select>
        </div>

        <div className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={!!formData.w4MultipleJobs}
              onChange={(e) => onChange('w4MultipleJobs', e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span>Step 2: Multiple Jobs / Spouse Works</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Step 3: Dependent Credits ($/yr)</label>
          <input
            type="number"
            step="100"
            value={formData.w4DependentCredit ?? 0}
            onChange={(e) => onChange('w4DependentCredit', parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur('w4DependentCredit')}
            className={getInputClass('w4DependentCredit', 'font-mono')}
            placeholder="2000"
          />
          {renderInlineError('w4DependentCredit')}
        </div>
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Step 4(c): Extra Withholding ($/period)</label>
          <input
            type="number"
            step="5"
            value={formData.w4ExtraWithholding ?? 0}
            onChange={(e) => onChange('w4ExtraWithholding', parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur('w4ExtraWithholding')}
            className={getInputClass('w4ExtraWithholding', 'font-mono')}
            placeholder="0"
          />
          {renderInlineError('w4ExtraWithholding')}
        </div>
      </div>
    </div>
  );
}
