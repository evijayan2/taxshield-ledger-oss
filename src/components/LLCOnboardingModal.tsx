import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, User, Landmark, Sparkles, CheckCircle2, ArrowRight, ArrowLeft, Calendar, X } from 'lucide-react';
import { Organization } from '../types';

interface LLCOnboardingModalProps {
  isOpen: boolean;
  initialOrg?: Organization;
  onSave: (org: Organization, taxYear?: number) => void;
  onClose?: () => void;
  isDismissable?: boolean;
}

export const LLCOnboardingModal: React.FC<LLCOnboardingModalProps> = ({
  isOpen,
  initialOrg,
  onSave,
  onClose,
  isDismissable = false,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Fields
  const [name, setName] = useState(initialOrg?.name || '');
  const [ein, setEin] = useState(initialOrg?.ein || '');
  const [stateTaxId, setStateTaxId] = useState(initialOrg?.stateTaxId || '');
  const [address, setAddress] = useState(initialOrg?.address || '');
  const [city, setCity] = useState(initialOrg?.city || '');
  const [state, setState] = useState(initialOrg?.state || 'PA');
  const [zip, setZip] = useState(initialOrg?.zip || '');
  const [ownerName, setOwnerName] = useState(initialOrg?.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(initialOrg?.ownerEmail || '');
  const [ownerTaxBracket, setOwnerTaxBracket] = useState(initialOrg?.ownerTaxBracket ?? 24);
  const [filingFrequencyPA, setFilingFrequencyPA] = useState<'SEMI_MONTHLY' | 'MONTHLY' | 'QUARTERLY'>(
    initialOrg?.filingFrequencyPA || 'MONTHLY'
  );
  const [standardMileageRate, setStandardMileageRate] = useState(initialOrg?.standardMileageRate ?? 0.67);

  // Step 2 Fields (Tax Year Setup)
  const [taxYear, setTaxYear] = useState<number>(2026);
  const [taxClassification, setTaxClassification] = useState<string>('DISREGARDED_SINGLE_MEMBER');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrg && isOpen) {
      setName(initialOrg.name || '');
      setEin(initialOrg.ein || '');
      setStateTaxId(initialOrg.stateTaxId || '');
      setAddress(initialOrg.address || '');
      setCity(initialOrg.city || '');
      setState(initialOrg.state || 'PA');
      setZip(initialOrg.zip || '');
      setOwnerName(initialOrg.ownerName || '');
      setOwnerEmail(initialOrg.ownerEmail || '');
      setOwnerTaxBracket(initialOrg.ownerTaxBracket ?? 24);
      setFilingFrequencyPA(initialOrg.filingFrequencyPA || 'MONTHLY');
      setStandardMileageRate(initialOrg.standardMileageRate ?? 0.67);
      setStep(1);
    }
  }, [initialOrg, isOpen]);

  if (!isOpen) return null;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your official LLC Legal Entity Name.');
      return;
    }
    if (!ein.trim()) {
      setError('Please enter your Federal EIN (Employer Identification Number).');
      return;
    }
    if (!ownerName.trim()) {
      setError('Please enter the Managing Member / Owner Name.');
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const updatedOrg: Organization = {
      id: initialOrg?.id || 'org_main',
      name: name.trim(),
      ein: ein.trim(),
      stateTaxId: stateTaxId.trim() || `PA-${ein.trim().replace(/\D/g, '')}`,
      address: address.trim() || 'Business Address Pending',
      city: city.trim() || 'Philadelphia',
      state: state.trim() || 'PA',
      zip: zip.trim() || '19102',
      ownerName: ownerName.trim(),
      ownerEmail: ownerEmail.trim() || 'owner@example.com',
      ownerTaxBracket: Number(ownerTaxBracket) || 24,
      filingFrequencyPA,
      standardMileageRate: Number(standardMileageRate) || 0.67,
    };

    onSave(updatedOrg, taxYear);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={isDismissable && onClose ? onClose : undefined}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Configure Your Micro-LLC Ledger
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </h2>
              <p className="text-xs text-emerald-100">
                Step {step} of 2: {step === 1 ? 'LLC Identity & Owner Defaults' : 'Tax Year Creation & Rule Setup'}
              </p>
            </div>
          </div>
          {isDismissable && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-100 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Navigation Bar */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>1</span>
            <span>1. LLC Identity Profile</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-300 dark:bg-slate-800" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>2</span>
            <span>2. Tax Year Setup ({taxYear})</span>
          </div>
        </div>

        {/* Modal Form Body */}
        {step === 1 ? (
          <form onSubmit={handleNextStep} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Section 1: Business Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Building2 className="w-4 h-4" />
                <span>1. LLC Legal & Tax Identity</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 md:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    LLC Legal Entity Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Solutions LLC"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Federal EIN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12-3456789"
                    value={ein}
                    onChange={e => setEin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    PA State Tax ID / Account ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PA-12345678"
                    value={stateTaxId}
                    onChange={e => setStateTaxId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Address */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Landmark className="w-4 h-4" />
                <span>2. Principal Place of Business Address</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1 md:col-span-3">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 100 Main Street, Suite 400"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Philadelphia"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">State</label>
                  <input
                    type="text"
                    placeholder="PA"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Zip Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 19102"
                    value={zip}
                    onChange={e => setZip(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Owner & Tax Config */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <User className="w-4 h-4" />
                <span>3. Owner & Tax Rate Defaults</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Managing Owner / Member Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Owner Email</label>
                  <input
                    type="email"
                    placeholder="e.g. alex@mycompany.com"
                    value={ownerEmail}
                    onChange={e => setOwnerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Marginal Federal Tax Bracket (%)</label>
                  <input
                    type="number"
                    min="10"
                    max="37"
                    step="1"
                    value={ownerTaxBracket}
                    onChange={e => setOwnerTaxBracket(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">PA Employer Filing Frequency</label>
                  <select
                    value={filingFrequencyPA}
                    onChange={e => setFilingFrequencyPA(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="MONTHLY">Monthly Remittance (REV-1667)</option>
                    <option value="QUARTERLY">Quarterly Remittance</option>
                    <option value="SEMI_MONTHLY">Semi-Monthly High Volume</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Standard IRS Mileage Rate ($/mile)</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0.5"
                    max="1.0"
                    value={standardMileageRate}
                    onChange={e => setStandardMileageRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              {isDismissable && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Next: Tax Year Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Tax Year Setup */
          <form onSubmit={handleFinalSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white">Step 2: Initialize Primary Tax Year</h4>
                <p className="text-slate-600 dark:text-slate-300">
                  TaxShield Ledger requires a first-class **Tax Year** record to link versioned federal, state, and local tax rules, withholding formulas, and compliance deadlines.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Initial Operating Tax Year
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={2020}
                    max={2035}
                    value={taxYear}
                    onChange={e => setTaxYear(parseInt(e.target.value, 10) || 2026)}
                    className="w-36 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    {[2025, 2026, 2027].map(yr => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setTaxYear(yr)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          taxYear === yr
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  LLC Tax Classification
                </label>
                <select
                  value={taxClassification}
                  onChange={e => setTaxClassification(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DISREGARDED_SINGLE_MEMBER">Single-Member Disregarded LLC (Schedule C Pass-Through)</option>
                  <option value="S_CORP_ELECTION">S-Corporation Election (Form 1120-S + W-2 Salary)</option>
                  <option value="PARTNERSHIP">Multi-Member Partnership (Form 1065)</option>
                </select>
              </div>

              {/* Jurisdictions Overview */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Default Attached Jurisdictions for {taxYear}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">US-FEDERAL</span>
                      <p className="text-[10px] text-slate-500">IRS Pub 15-T & FICA 6.2%</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">PA-STATE</span>
                      <p className="text-[10px] text-slate-500">3.07% SIT & Employer UC</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to LLC Profile
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Complete Setup & Activate Ledger</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </div>
);
};
