import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Employee } from '../../types';

interface StaffCompensationTabProps {
  formData: Omit<Employee, 'id'>;
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  onChange: (field: keyof Omit<Employee, 'id'>, value: any) => void;
  onBlur: (field: keyof Omit<Employee, 'id'>) => void;
}

/**
 * Tab component for Staff Compensation, Pay Type, Pay Rate, and Direct Deposit settings with inline focus-out validation.
 */
export function StaffCompensationTab({
  formData,
  errors,
  touched,
  onChange,
  onBlur,
}: StaffCompensationTabProps) {
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
      {/* Pay Type & Rate */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Employment Type</label>
          <select
            value={formData.employmentType}
            onChange={(e) => onChange('employmentType', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium"
          >
            <option value="W2_HOURLY">W-2 Non-Exempt Hourly</option>
            <option value="W2_SALARY">W-2 Exempt Salary</option>
            <option value="1099_CONTRACTOR">1099 Independent Contractor</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
            Pay Rate ($ {formData.employmentType === 'W2_SALARY' ? 'per period' : 'per hour'}) *
          </label>
          <input
            type="number"
            step="0.50"
            required
            min="0"
            value={formData.payRate}
            onChange={(e) => onChange('payRate', parseFloat(e.target.value) || 0)}
            onBlur={() => onBlur('payRate')}
            className={getInputClass('payRate', 'font-mono text-base font-bold text-emerald-600 dark:text-emerald-400')}
          />
          {renderInlineError('payRate')}
        </div>
      </div>

      {/* ACH Direct Deposit (Single Supported Bank) */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            ACH Direct Deposit (Single Bank Account)
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30">
            1 Bank / Employee
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Bank Name</label>
            <input
              type="text"
              value={formData.bankName || ''}
              onChange={(e) => onChange('bankName', e.target.value)}
              className={getInputClass('bankName')}
              placeholder="e.g. Chase Bank, PNC Bank"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Account Type</label>
            <select
              value={formData.accountType || 'CHECKING'}
              onChange={(e) => onChange('accountType', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium"
            >
              <option value="CHECKING">Checking Account</option>
              <option value="SAVINGS">Savings Account</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">ABA Routing Number (9 Digits)</label>
            <input
              type="text"
              maxLength={9}
              value={formData.routingNumber || ''}
              onChange={(e) => onChange('routingNumber', e.target.value.replace(/\D/g, ''))}
              onBlur={() => onBlur('routingNumber')}
              className={getInputClass('routingNumber', 'font-mono')}
              placeholder="031000053"
            />
            {renderInlineError('routingNumber')}
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Account Number</label>
            <input
              type="text"
              value={formData.accountNumber || ''}
              onChange={(e) => onChange('accountNumber', e.target.value.replace(/\D/g, ''))}
              onBlur={() => onBlur('accountNumber')}
              className={getInputClass('accountNumber', 'font-mono')}
              placeholder="1234567890"
            />
            {renderInlineError('accountNumber')}
          </div>
        </div>
      </div>
    </div>
  );
}
