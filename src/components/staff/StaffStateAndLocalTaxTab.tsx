import React from 'react';
import { Building2, Info, MapPin, Briefcase, AlertCircle } from 'lucide-react';
import { Employee } from '../../types';
import { PA_SCHOOL_DISTRICTS, findDistrictByPsdCode } from '../../utils/paSchoolDistricts';
import { getLocalJurisdictionsByState } from '../../utils/localTaxDistricts';
import { SUPPORTED_STATES, getStateDisplayName } from '../../utils/supportedStates';

interface StaffStateAndLocalTaxTabProps {
  formData: Omit<Employee, 'id'>;
  companyState: string;
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  onChange: (field: keyof Omit<Employee, 'id'>, value: any) => void;
  onBlur: (field: keyof Omit<Employee, 'id'>) => void;
}

/**
 * Tab component for Multi-State Tax Withholding, Residence PSD, and Local Tax configuration with inline focus-out validation.
 */
export function StaffStateAndLocalTaxTab({
  formData,
  companyState,
  errors,
  touched,
  onChange,
  onBlur,
}: StaffStateAndLocalTaxTabProps) {
  const residentState = (formData.state || companyState || 'DE').toUpperCase();
  const workState = (formData.workState || companyState || residentState || 'DE').toUpperCase();
  const isCrossState = residentState !== workState;
  const isPaResident = residentState === 'PA';
  const isPaWork = workState === 'PA';

  const handleDistrictChange = (psdCode: string) => {
    if (psdCode === 'CUSTOM') {
      onChange('paPsdName', 'Custom School District');
      onChange('localTaxJurisdictionName', 'Custom School District');
      return;
    }
    const district = findDistrictByPsdCode(psdCode);
    if (district) {
      onChange('paPsdCode', district.psdCode);
      onChange('paPsdName', district.name);
      onChange('localTaxJurisdictionCode', `PA-PSD-${district.psdCode}`);
      onChange('localTaxJurisdictionName', district.name);
    }
  };

  const handleLocalSelectChange = (val: string, availableList: any[]) => {
    if (val === 'CUSTOM' || val === 'NONE') {
      onChange('localTaxJurisdictionCode', '');
      onChange('localTaxJurisdictionName', 'None / Out of Area');
      onChange('paPsdCode', '');
      onChange('paPsdName', '');
      return;
    }
    const match = availableList.find((d) => d.code === val || d.code.endsWith(val));
    if (match) {
      const cleanPsd = match.code.replace('PA-PSD-', '');
      onChange('localTaxJurisdictionCode', match.code);
      onChange('localTaxJurisdictionName', match.name);
      if (match.state === 'PA') {
        onChange('paPsdCode', cleanPsd);
        onChange('paPsdName', match.name);
      }
    } else {
      handleDistrictChange(val);
    }
  };

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

  const availableLocalDistricts = getLocalJurisdictionsByState(isPaResident ? 'PA' : workState);

  return (
    <div className="space-y-4">
      {/* Multi-State Jurisdiction Summary Header */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Tax Jurisdiction Allocation
          </span>
          {isCrossState ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
              Multi-State ({workState} Work / {residentState} Res)
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              Single-State ({workState})
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-slate-400" /> Work State (SIT & SUTA)
            </label>
            <select
              value={workState}
              onChange={(e) => onChange('workState', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-medium text-xs"
            >
              {SUPPORTED_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" /> Residence State (Address)
            </label>
            <div className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-medium text-xs">
              {getStateDisplayName(residentState)}
            </div>
          </div>
        </div>

        {/* Multi-State Scenario Explanations */}
        {workState === 'DE' && residentState === 'PA' && (
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-2 text-[11px] text-blue-900 dark:text-blue-200">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">DE Employer + PA Resident:</strong>
              Delaware State Income Tax (DE SIT) and DE SUTA apply to wages earned in Delaware. Under PA Act 32, PA residents are subject to resident Local Earned Income Tax (EIT) according to their home PSD code.
            </div>
          </div>
        )}

        {workState === 'PA' && residentState === 'NJ' && (
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-start gap-2 text-[11px] text-purple-900 dark:text-purple-200">
            <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">PA / NJ Reciprocity Agreement:</strong>
              Wages earned by NJ residents in PA are exempt from PA SIT under the reciprocal agreement (Form REV-419). NJ Gross Income Tax withholding applies instead.
            </div>
          </div>
        )}
      </div>

      {/* Local Tax Jurisdiction Selector */}
      <div>
        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
          {isPaResident ? 'PA Resident School District / PSD Code (Act 32)' : `${workState} Local Tax Jurisdiction`}
        </label>
        <select
          value={
            formData.localTaxJurisdictionCode ||
            (isPaResident && formData.paPsdCode ? `PA-PSD-${formData.paPsdCode}` : 'CUSTOM')
          }
          onChange={(e) => handleLocalSelectChange(e.target.value, availableLocalDistricts)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium"
        >
          {availableLocalDistricts.length > 0 ? (
            <optgroup label={`${isPaResident ? 'Pennsylvania' : workState} Local Tax Jurisdictions`}>
              {availableLocalDistricts.map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name} — {district.code}
                </option>
              ))}
            </optgroup>
          ) : (
            <option value="NONE">No local earned income tax required for {isPaResident ? 'PA' : workState}</option>
          )}
          <option value="CUSTOM">-- Custom / Manual Local Jurisdiction --</option>
        </select>
      </div>

      {/* Jurisdiction identifier only — statutory values are never editable here. */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Jurisdiction Code / PSD</label>
          <input
            type="text"
            value={formData.localTaxJurisdictionCode || formData.paPsdCode || ''}
            onChange={(e) => {
              const val = e.target.value;
              const cleanPsd = val.replace('PA-PSD-', '');
              onChange('localTaxJurisdictionCode', val);
              if (isPaResident) {
                onChange('paPsdCode', cleanPsd);
              }
            }}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
            placeholder="e.g. 460401 or DE-LOCAL-WILMINGTON"
          />
        </div>
      </div>

      {/* Flat Local Tax / PA LST Section */}
      {(isPaResident || isPaWork) && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              PA Local Services Tax (LST)
            </span>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.paLstExempt}
                onChange={(e) => {
                  onChange('paLstExempt', e.target.checked);
                  onChange('localFlatTaxExempt', e.target.checked);
                }}
                className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <span>LST Exempt (&lt; $12k income / multiple jobs)</span>
            </label>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            The active local TaxRuleVersion determines the amount and payroll-period allocation.
          </p>
        </div>
      )}
    </div>
  );
}
