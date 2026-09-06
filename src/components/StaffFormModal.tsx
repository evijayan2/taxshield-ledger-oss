import React, { useState, useEffect } from 'react';
import { X, User, DollarSign, Building, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Employee } from '../types';
import { formatPhoneNumber } from '../utils/validators';
import { createDefaultEmployeeForm, getTaxDefaultsForResidenceState } from './staff/staffFormDefaults';
import { validateEmployeeField, validateEmployeeForm, getTabForField } from './staff/staffValidation';
import { StaffPersonalTab } from './staff/StaffPersonalTab';
import { StaffCompensationTab } from './staff/StaffCompensationTab';
import { StaffStateAndLocalTaxTab } from './staff/StaffStateAndLocalTaxTab';
import { StaffW4Tab } from './staff/StaffW4Tab';

export interface StaffFormModalProps {
  isOpen: boolean;
  employee?: Employee | null;
  companyState?: string;
  onSave: (employee: Employee, sendInvite?: boolean) => void;
  onClose: () => void;
}

type TabType = 'personal' | 'pay' | 'localTax' | 'w4';

/**
 * Slide-over drawer form for creating or editing an employee with multi-state tax support and inline validation.
 */
export function StaffFormModal({
  isOpen,
  employee,
  companyState = 'DE',
  onSave,
  onClose,
}: StaffFormModalProps) {
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>(() =>
    createDefaultEmployeeForm(companyState)
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [sendInvite, setSendInvite] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [topError, setTopError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      const { id, ...rest } = employee;
      setFormData(rest);
      setSendInvite(false);
    } else {
      setFormData(createDefaultEmployeeForm(companyState));
      setSendInvite(true);
    }
    setTouched({});
    setErrors({});
    setTopError(null);
    setActiveTab('personal');
  }, [employee, isOpen, companyState]);

  if (!isOpen) return null;

  const handleBlur = (field: keyof Omit<Employee, 'id'>) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateEmployeeField(field, formData[field], formData);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleChange = (
    fieldOrObject: keyof Omit<Employee, 'id'> | Partial<Omit<Employee, 'id'>>,
    value?: any
  ) => {
    if (typeof fieldOrObject === 'object' && fieldOrObject !== null) {
      setFormData((prev) => ({
        ...prev,
        ...fieldOrObject,
      }));
      return;
    }

    const field = fieldOrObject as keyof Omit<Employee, 'id'>;
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'age' && typeof value === 'number' && value < 18) {
        if (!updated.relationshipToOwner || updated.relationshipToOwner === 'NONE') {
          updated.relationshipToOwner = 'CHILD_UNDER_18';
        }
      }
      return updated;
    });

    if (touched[field]) {
      setFormData((latest) => {
        const errorMsg = validateEmployeeField(field, value, latest);
        setErrors((prev) => ({ ...prev, [field]: errorMsg }));
        return latest;
      });
    }
  };

  const handleResidenceStateChange = (newResState: string) => {
    const defaults = getTaxDefaultsForResidenceState(newResState, formData.workState || companyState);
    setFormData((prev) => ({
      ...prev,
      ...defaults,
      state: newResState,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allErrors = validateEmployeeForm(formData);
    const errorKeys = Object.keys(allErrors);

    if (errorKeys.length > 0) {
      const allTouched: Record<string, boolean> = {};
      for (const k of errorKeys) allTouched[k] = true;
      setTouched((prev) => ({ ...prev, ...allTouched }));
      setErrors(allErrors);
      setTopError('Please correct the highlighted fields before saving.');
      const firstTab = getTabForField(errorKeys[0]);
      setActiveTab(firstTab);
      return;
    }

    const masked = formData.accountNumber && formData.accountNumber.length >= 4
      ? `•••• ${formData.accountNumber.slice(-4)}`
      : formData.bankAccountMasked || undefined;

    const finalEmployee: Employee = {
      id: employee?.id || `emp_${Date.now()}`,
      ...formData,
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone ? formatPhoneNumber(formData.phone) : '',
      bankAccountMasked: masked,
    };
    onSave(finalEmployee, sendInvite);
  };

  const tabHasError = (tab: TabType) => {
    return Object.entries(errors).some(([f, err]) => Boolean(err && touched[f] && getTabForField(f) === tab));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {employee ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure payroll profile, Form W-4 withholding, and state/local tax jurisdictions.
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium px-6 gap-2">
            {[
              { id: 'personal', label: 'Personal & Contact', icon: User },
              { id: 'pay', label: 'Compensation', icon: DollarSign },
              { id: 'localTax', label: 'State & Local Tax', icon: Building },
              { id: 'w4', label: 'IRS Form W-4', icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as TabType)}
                className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {tabHasError(id as TabType) && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
            {topError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{topError}</span>
              </div>
            )}

            {activeTab === 'personal' && (
              <StaffPersonalTab
                formData={formData}
                errors={errors}
                touched={touched}
                isEditing={Boolean(employee)}
                sendInvite={sendInvite}
                onSendInviteChange={setSendInvite}
                onChange={handleChange}
                onBlur={handleBlur}
                onResidenceStateChange={handleResidenceStateChange}
              />
            )}

            {activeTab === 'pay' && (
              <StaffCompensationTab
                formData={formData}
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            )}

            {activeTab === 'localTax' && (
              <StaffStateAndLocalTaxTab
                formData={formData}
                companyState={companyState}
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            )}

            {activeTab === 'w4' && (
              <StaffW4Tab
                formData={formData}
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            )}

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{employee ? 'Save Changes' : 'Create Staff Member'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
