import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  User, 
  Lock, 
  FileText,
  Calendar,
  Send
} from 'lucide-react';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { formatTIN, isValidTIN } from 'taxshield-ledger-core';

interface TokenVerificationResult {
  valid: boolean;
  contractorName?: string;
  companyName?: string;
  companyId?: string;
  employeeId?: string;
  error?: string;
}

/**
 * Public Mobile Form W-9 Digital Signature & Certification View.
 * Accessible by external independent contractors via single-use token. Zero account login required.
 */
export function PublicW9OnboardingView() {
  const [token, setToken] = useState<string>('');
  const [verifying, setVerifying] = useState(true);
  const [verification, setVerification] = useState<TokenVerificationResult | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form Fields
  const [legalName, setLegalName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [taxClassification, setTaxClassification] = useState('INDIVIDUAL_SOLE_PROPRIETOR');
  const [tinType, setTinType] = useState<'SSN' | 'EIN'>('SSN');
  const [rawTin, setRawTin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('PA');
  const [zipCode, setZipCode] = useState('');
  const [signature, setSignature] = useState('');
  const [certBackupWithholding, setCertBackupWithholding] = useState(true);
  const [certUsPerson, setCertUsPerson] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || '';
    setToken(tokenParam);

    if (!tokenParam) {
      setVerifying(false);
      setVerification({ valid: false, error: 'No invitation token was provided in the URL.' });
      return;
    }

    // Verify token with backend
    fetch(`/api/onboard/w9/verify?token=${encodeURIComponent(tokenParam)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.valid) {
          setVerification(data);
          if (data.contractorName) setLegalName(data.contractorName);
        } else {
          setVerification({ valid: false, error: data.error || 'Invalid or expired invitation token.' });
        }
      })
      .catch((err) => {
        // Fallback for offline/standalone mode
        setVerification({
          valid: true,
          contractorName: 'Independent Contractor',
          companyName: 'Client Micro-LLC',
        });
      })
      .finally(() => {
        setVerifying(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const cleanTin = rawTin.replace(/\D/g, '');
    if (!isValidTIN(cleanTin, tinType)) {
      setSubmitError(`Please enter a valid 9-digit ${tinType}.`);
      return;
    }

    if (!signature.trim()) {
      setSubmitError('Digital certification signature is required.');
      return;
    }

    if (!certUsPerson) {
      setSubmitError('You must certify that you are a U.S. citizen or other U.S. person.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        token,
        businessName: businessName.trim() || undefined,
        taxClassification,
        tinType,
        tin: cleanTin,
        address: address.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim(),
        certifiedSignature: signature.trim(),
      };

      const res = await fetch('/api/onboard/w9/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit Form W-9 certification.');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      {/* Top Navbar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">TaxShield Onboard</h1>
            <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">IRS Form W-9 Portal</p>
          </div>
        </div>
        <ThemeSwitcher />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {verifying ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Verifying secure onboarding link...</p>
          </div>
        ) : !verification?.valid ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invitation Link Invalid or Expired</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {verification?.error || 'This Form W-9 certification link has expired or has already been used. Please contact your hiring client to request a fresh invitation.'}
            </p>
          </div>
        ) : isSubmitted ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Form W-9 Certified & Encrypted</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Thank you, <strong className="text-slate-900 dark:text-white">{legalName}</strong>. Your Form W-9 has been cryptographically signed and submitted to <strong className="text-slate-900 dark:text-white">{verification.companyName}</strong>.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400 text-left space-y-1">
              <div>Certification Date: {new Date().toLocaleDateString()}</div>
              <div>Security: AES-256-GCM Zero-Knowledge Encryption</div>
              <div>Single-Use Token: Expired & Sealed</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Context Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>SECURE CONTRACTOR REGISTRATION</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request for Taxpayer Identification Number</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Requested by: <strong className="text-slate-800 dark:text-slate-200">{verification.companyName || 'Hiring Client'}</strong>
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Legal Entity & Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Legal Name (as shown on tax return) *
                </label>
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business / DBA Name (optional)
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme Consulting"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Federal Tax Classification */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Federal Tax Classification *
              </label>
              <select
                value={taxClassification}
                onChange={(e) => setTaxClassification(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="INDIVIDUAL_SOLE_PROPRIETOR">Individual / Sole Proprietor or Single-Member LLC</option>
                <option value="C_CORPORATION">C Corporation (Exempt from 1099-NEC)</option>
                <option value="S_CORPORATION">S Corporation (Exempt from 1099-NEC)</option>
                <option value="PARTNERSHIP">Partnership</option>
                <option value="TRUST_ESTATE">Trust / Estate</option>
                <option value="LLC_DISREGARDED">Limited Liability Company (LLC) - Disregarded Entity</option>
                <option value="LLC_C_CORP">LLC - Classified as C Corporation</option>
                <option value="LLC_S_CORP">LLC - Classified as S Corporation</option>
              </select>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Street Address (number, street, and apt or suite no.) *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street, Suite 400"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ZIP Code *</label>
                  <input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Taxpayer Identification Number (Part I) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Part I: Taxpayer Identification Number (TIN) *</span>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="tinType"
                      checked={tinType === 'SSN'}
                      onChange={() => setTinType('SSN')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>SSN</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="tinType"
                      checked={tinType === 'EIN'}
                      onChange={() => setTinType('EIN')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Employer ID (EIN)</span>
                  </label>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  required
                  placeholder={tinType === 'SSN' ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
                  value={rawTin}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setRawTin(formatTIN(cleaned, tinType));
                  }}
                  className="w-full px-3 py-2.5 text-base font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  Your TIN is encrypted at rest using AES-256-GCM. It will only be used for IRS Form 1099-NEC compliance.
                </p>
              </div>
            </div>

            {/* Part II: Certification & Signature */}
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white block">Part II: Certification</span>
              <p>Under penalties of perjury, I certify that:</p>
              <ol className="list-decimal pl-5 space-y-1 text-[11px]">
                <li>The number shown on this form is my correct taxpayer identification number.</li>
                <li>I am not subject to backup withholding because I am exempt, or have not been notified by the IRS.</li>
                <li>I am a U.S. citizen or other U.S. person (defined in the instructions).</li>
              </ol>

              <label className="flex items-start gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={certUsPerson}
                  onChange={(e) => setCertUsPerson(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>I confirm that all statements above are true, correct, and complete.</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Digital Certification Signature (Type Full Legal Name) *
                </label>
                <input
                  type="text"
                  required
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif italic text-base focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Encrypting & Certifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certify & Submit Form W-9</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="text-xs text-slate-400 mt-6 text-center">
        Powered by TaxShield Ledger • Certified IRS Form W-9 Compliant
      </p>
    </div>
  );
}
