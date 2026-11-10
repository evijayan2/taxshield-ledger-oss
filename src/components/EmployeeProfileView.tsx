import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  FileText, 
  CreditCard, 
  MapPin, 
  ShieldCheck, 
  Save, 
  AlertCircle,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { User as UserType, Employee, Organization } from '../types';

interface EmployeeProfileViewProps {
  user: UserType | null;
  employee: Employee | null;
  org: Organization;
  isReadOnly?: boolean;
  onSaveProfile?: (updatedData: Partial<Employee>) => void;
}

export function EmployeeProfileView({
  user,
  employee,
  org,
  isReadOnly = false,
  onSaveProfile,
}: EmployeeProfileViewProps) {
  // Form State initialized from employee profile or defaults
  const [fullName, setFullName] = useState(
    employee ? `${employee.firstName} ${employee.lastName}` : user?.email?.split('@')[0] || 'Employee'
  );
  const [email, setEmail] = useState(employee?.email || user?.email || '');
  const [phone, setPhone] = useState(employee?.phone || '(555) 234-5678');
  
  // Residence Address
  const [street, setStreet] = useState(employee?.streetAddress || '123 Market St');
  const [city, setCity] = useState(employee?.city || 'Philadelphia');
  const [stateCode, setStateCode] = useState(employee?.state || 'PA');
  const [zip, setZip] = useState(employee?.zip || '19106');

  // Tax Withholding (W-4)
  const [filingStatus, setFilingStatus] = useState(employee?.taxFilingStatus || 'SINGLE');
  const [dependentsAmount, setDependentsAmount] = useState(employee?.w4DependentsAmount ? String(employee.w4DependentsAmount) : '0');
  const [extraWithholding, setExtraWithholding] = useState(employee?.w4ExtraWithholding ? String(employee.w4ExtraWithholding) : '0');

  // Direct Deposit ACH
  const [bankName, setBankName] = useState(employee?.bankName || 'PNC Bank, N.A.');
  const [routingNumber, setRoutingNumber] = useState(employee?.routingNumber || '031000053');
  const [accountNumber, setAccountNumber] = useState(employee?.accountNumber ? `••••${employee.accountNumber.slice(-4)}` : '••••4321');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveProfile) {
      const parts = fullName.split(' ');
      onSaveProfile({
        firstName: parts[0] || fullName,
        lastName: parts.slice(1).join(' ') || '',
        email,
        phone,
        streetAddress: street,
        city,
        state: stateCode,
        zip,
        taxFilingStatus: filingStatus,
        w4DependentsAmount: parseFloat(dependentsAmount) || 0,
        w4ExtraWithholding: parseFloat(extraWithholding) || 0,
        bankName,
        routingNumber,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <User className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">My Profile & Direct Deposit</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            View and update your personal details, home tax residence address, W-4 withholding declarations, and direct deposit ACH target.
          </p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold animate-fade-in self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Saved Successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Grid Container for Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Personal & Contact Information */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Personal & Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Social Security Number (SSN)</label>
                <div className="relative">
                  <input
                    type="text"
                    value="***-**-6789"
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-500 font-mono text-xs cursor-not-allowed"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">SSN is encrypted and masked for identity protection.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Home Tax Residence Address */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Tax Residence Address
            </h3>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Mid-Year Relocation Warning:</strong> Changing your home state or local municipality triggers effective-dated residence history updates for state/local EIT tax withholding.
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                    disabled={isReadOnly}
                    maxLength={2}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-bold focus:outline-none focus:border-indigo-500 uppercase disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Tax Withholding (W-4) Setup */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-500" />
              Tax Withholding (Form W-4)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Federal W-4 Filing Status</label>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                >
                  <option value="SINGLE">Single or Married Filing Separately</option>
                  <option value="MARRIED">Married Filing Jointly</option>
                  <option value="HEAD_OF_HOUSEHOLD">Head of Household</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Dependents Credit Amount ($)</label>
                <input
                  type="number"
                  value={dependentsAmount}
                  onChange={(e) => setDependentsAmount(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Additional Per-Paycheck Withholding ($)</label>
                <input
                  type="number"
                  value={extraWithholding}
                  onChange={(e) => setExtraWithholding(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Direct Deposit ACH Setup */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              Direct Deposit ACH Target
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ACH Routing Number (9 Digits)</label>
                <input
                  type="text"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Action Footer */}
        {!isReadOnly && (
          <div className="flex justify-end p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile & Direct Deposit</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
