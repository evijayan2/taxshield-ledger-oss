import React, { useState, useEffect } from 'react';
import { X, User, DollarSign, MapPin, Building, FileText, CheckCircle2 } from 'lucide-react';
import { Employee } from '../types';
import { PA_SCHOOL_DISTRICTS, findDistrictByPsdCode } from '../utils/paSchoolDistricts';
import { getLocalJurisdictionsByState, findLocalJurisdictionByCode } from '../utils/localTaxDistricts';

interface StaffFormModalProps {
  isOpen: boolean;
  employee?: Employee | null;
  onSave: (employee: Employee) => void;
  onClose: () => void;
}

const DEFAULT_EMPLOYEE: Omit<Employee, 'id'> = {
  firstName: '',
  lastName: '',
  age: 30,
  relationshipToOwner: 'NONE',
  email: '',
  phone: '',
  ssnLastFour: '',
  streetAddress: '',
  city: '',
  state: 'PA',
  zip: '',
  employmentType: 'W2_HOURLY',
  payRate: 25.0,
  payFrequency: 'BI_WEEKLY',
  w4FilingStatus: 'SINGLE',
  w4MultipleJobs: false,
  w4DependentCredit: 0,
  w4OtherIncome: 0,
  w4Deductions: 0,
  w4ExtraWithholding: 0,
  paPsdCode: '460401',
  paPsdName: 'Lower Merion School District',
  paResidentEitRate: 0.01,
  paWorkPsdCode: '510101',
  paWorkEitRate: 0.0375,
  paLstAnnual: 52.0,
  paLstExempt: false,
  bankName: '',
  accountType: 'CHECKING',
  routingNumber: '',
  accountNumber: '',
  bankAccountMasked: '',
  isActive: true,
};

/**
 * Modal form for creating a new employee or editing an existing staff member.
 */
export function StaffFormModal({ isOpen, employee, onSave, onClose }: StaffFormModalProps) {
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({ ...DEFAULT_EMPLOYEE });
  const [activeTab, setActiveTab] = useState<'personal' | 'pay' | 'localTax' | 'w4'>('personal');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      const { id, ...rest } = employee;
      setFormData(rest);
    } else {
      setFormData({ ...DEFAULT_EMPLOYEE });
    }
    setError(null);
    setActiveTab('personal');
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Omit<Employee, 'id'>, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'age' && typeof value === 'number' && value < 18) {
        if (!updated.relationshipToOwner || updated.relationshipToOwner === 'NONE') {
          updated.relationshipToOwner = 'CHILD_UNDER_18';
        }
      }
      return updated;
    });
  };

  const handleDistrictChange = (psdCode: string) => {
    if (psdCode === 'CUSTOM') {
      handleChange('paPsdName', 'Custom School District');
      return;
    }
    const district = findDistrictByPsdCode(psdCode);
    if (district) {
      setFormData((prev) => ({
        ...prev,
        paPsdCode: district.psdCode,
        paPsdName: district.name,
        paResidentEitRate: district.defaultEitRate,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First and Last Name are required.');
      setActiveTab('personal');
      return;
    }
    if (formData.payRate <= 0) {
      setError('Pay rate must be greater than zero.');
      setActiveTab('pay');
      return;
    }

    if (formData.routingNumber && formData.routingNumber.length > 0 && formData.routingNumber.length !== 9) {
      setError('ABA Routing Number must be exactly 9 digits.');
      setActiveTab('pay');
      return;
    }

    const masked = formData.accountNumber && formData.accountNumber.length >= 4
      ? `•••• ${formData.accountNumber.slice(-4)}`
      : formData.bankAccountMasked || undefined;

    const finalEmployee: Employee = {
      id: employee?.id || `emp_${Date.now()}`,
      ...formData,
      bankAccountMasked: masked,
    };
    onSave(finalEmployee);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {employee ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure payroll profile, W-4 withholding, and PA local tax PSD code.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'personal'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Personal & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pay')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'pay'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Compensation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('localTax')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'localTax'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" /> State & Local Tax
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('w4')}
            className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'w4'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> IRS Form W-4
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                    placeholder="(555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Age</label>
                  <input
                    type="number"
                    min="16"
                    max="100"
                    value={formData.age ?? ''}
                    onChange={(e) => handleChange('age', parseInt(e.target.value, 10) || undefined)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">SSN Last 4</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.ssnLastFour}
                    onChange={(e) => handleChange('ssnLastFour', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="1234"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Status</label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => handleChange('isActive', e.target.value === 'active')}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="active">Active Staff</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Relationship to LLC Owner</label>
                <select
                  value={formData.relationshipToOwner || 'NONE'}
                  onChange={(e) => handleChange('relationshipToOwner', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="NONE">Standard W-2 Employee (Unrelated)</option>
                  <option value="CHILD_UNDER_18">Child (Under 18) — FICA & PA UC Exempt</option>
                  <option value="CHILD_18_TO_20">Child (18–20) — PA UC Exempt</option>
                  <option value="SPOUSE">Spouse — PA UC Exempt</option>
                  <option value="PARENT">Parent — PA UC Exempt</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Home Street Address
                </label>
                <input
                  type="text"
                  value={formData.streetAddress || ''}
                  onChange={(e) => handleChange('streetAddress', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white mb-2"
                  placeholder="742 Evergreen Terrace"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="State (PA)"
                  />
                  <input
                    type="text"
                    value={formData.zip || ''}
                    onChange={(e) => handleChange('zip', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pay' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => handleChange('employmentType', e.target.value)}
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
                    onChange={(e) => handleChange('payRate', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono text-base font-bold text-emerald-600 dark:text-emerald-400"
                  />
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
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                      placeholder="e.g. Chase Bank, PNC Bank"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Account Type</label>
                    <select
                      value={formData.accountType || 'CHECKING'}
                      onChange={(e) => handleChange('accountType', e.target.value)}
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
                      onChange={(e) => handleChange('routingNumber', e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                      placeholder="031000053"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber || ''}
                      onChange={(e) => handleChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'localTax' && (
            <div className="space-y-4">
              {(() => {
                const currentEmpState = (formData.workState || formData.state || 'DE').toUpperCase();
                const availableLocalDistricts = getLocalJurisdictionsByState(currentEmpState);

                return (
                  <>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                        {currentEmpState} Local Tax Jurisdiction
                      </label>
                      <select
                        value={
                          formData.localTaxJurisdictionCode ||
                          (PA_SCHOOL_DISTRICTS.some((d) => d.psdCode === formData.paPsdCode) ? formData.paPsdCode : 'CUSTOM')
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'CUSTOM' || val === 'NONE') {
                            handleChange('localTaxJurisdictionCode', '');
                            handleChange('localTaxJurisdictionName', 'None / Out of Area');
                            handleChange('localTaxRate', 0);
                          } else {
                            const match = availableLocalDistricts.find(d => d.code === val || d.code.endsWith(val));
                            if (match) {
                              handleChange('localTaxJurisdictionCode', match.code);
                              handleChange('localTaxJurisdictionName', match.name);
                              handleChange('localTaxRate', match.defaultRate);
                              if (currentEmpState === 'PA') {
                                handleChange('paPsdCode', val.replace('PA-PSD-', ''));
                                handleChange('paResidentEitRate', match.defaultRate);
                              }
                            } else {
                              handleDistrictChange(val);
                            }
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-medium"
                      >
                        {availableLocalDistricts.length > 0 ? (
                          <optgroup label={`${currentEmpState} Local Tax Jurisdictions`}>
                            {availableLocalDistricts.map((district) => (
                              <option key={district.code} value={district.code}>
                                {district.name} — {district.code} ({parseFloat((district.defaultRate * 100).toFixed(3))}% Rate)
                              </option>
                            ))}
                          </optgroup>
                        ) : (
                          <option value="NONE">No local earned income tax required for {currentEmpState}</option>
                        )}
                        <option value="CUSTOM">-- Custom / Manual Local Jurisdiction --</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Jurisdiction Code / PSD</label>
                        <input
                          type="text"
                          value={formData.localTaxJurisdictionCode || formData.paPsdCode || ''}
                          onChange={(e) => {
                            handleChange('localTaxJurisdictionCode', e.target.value);
                            if (currentEmpState === 'PA') handleChange('paPsdCode', e.target.value);
                          }}
                          className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
                          placeholder="e.g. DE-LOCAL-WILMINGTON or 150202"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Local Tax Rate (Decimal)</label>
                        <input
                          type="number"
                          step="0.00001"
                          value={formData.localTaxRate ?? formData.paResidentEitRate ?? 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleChange('localTaxRate', val);
                            if (currentEmpState === 'PA') handleChange('paResidentEitRate', val);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                        />
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-mono">
                          Equivalent Rate: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{parseFloat((((formData.localTaxRate ?? formData.paResidentEitRate ?? 0)) * 100).toFixed(3))}%</strong>
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'w4' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Step 1: Filing Status</label>
                  <select
                    value={formData.w4FilingStatus || 'SINGLE'}
                    onChange={(e) => handleChange('w4FilingStatus', e.target.value)}
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
                      onChange={(e) => handleChange('w4MultipleJobs', e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
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
                    onChange={(e) => handleChange('w4DependentCredit', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="2000"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Step 4(c): Extra Withholding ($/period)</label>
                  <input
                    type="number"
                    step="5"
                    value={formData.w4ExtraWithholding ?? 0}
                    onChange={(e) => handleChange('w4ExtraWithholding', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
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
