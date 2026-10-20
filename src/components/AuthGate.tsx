import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  LogOut, 
  Sun, 
  Moon,
  Mail,
  KeyRound,
  CheckCircle2,
  Building2,
  UserCheck,
  Sparkles,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SUPPORTED_STATES, getSupportedStateByCode } from '../utils/supportedStates';
import { isValidEin, formatEin, isValidEmail } from '../utils/validators';

type GateView = 'SIGN_IN' | 'RESET_REQUEST' | 'RESET_CONFIRM' | 'ACCEPT_INVITE' | 'BOOTSTRAP_WIZARD';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { 
    user, 
    membership,
    loading, 
    isAuthorized, 
    authError, 
    bootstrapStatus,
    clearAuthError, 
    signInEmail,
    resetPassword,
    confirmPasswordReset,
    acceptInvitation,
    getInvitationDetails,
    bootstrapSystem,
    signOut 
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [currentView, setCurrentView] = useState<GateView>('SIGN_IN');
  const [urlToken, setUrlToken] = useState<string | null>(null);

  // Invitation flow states
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteExpired, setInviteExpired] = useState(false);
  const [inviteCompanyName, setInviteCompanyName] = useState('');
  const [hasExistingAccount, setHasExistingAccount] = useState(false);

  // Bootstrap Wizard internal step (1: Company Setup, 2: Owner Password)
  const [bootstrapStep, setBootstrapStep] = useState<1 | 2>(1);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Company Form State for Bootstrap
  const [companyName, setCompanyName] = useState('');
  const [ein, setEin] = useState('');
  const [stateTaxId, setStateTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('PA');
  const [zip, setZip] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [payFrequency, setPayFrequency] = useState<'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY'>('BI_WEEKLY');
  const [stateFilingFrequency, setStateFilingFrequency] = useState<'MONTHLY' | 'SEMI_MONTHLY' | 'QUARTERLY' | 'ANNUALLY'>('MONTHLY');

  // Check URL query parameters for invite / reset links or bootstrap mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const action = params.get('action');

    if (token) {
      setUrlToken(token);
      if (action === 'invite') {
        setCurrentView('ACCEPT_INVITE');
        setInviteLoading(true);
        setInviteExpired(false);
        setLocalError(null);
        getInvitationDetails(token)
          .then((details) => {
            setEmail(details.email);
            setDisplayName(details.displayName);
            setInviteCompanyName(details.companyName);
            setHasExistingAccount(Boolean(details.hasExistingAccount));
          })
          .catch((err: any) => {
            setEmail('');
            setDisplayName('');
            const msg = err.message || 'This invitation link has expired or has already been used.';
            if (msg.includes('expired') || msg.includes('used') || msg.includes('invalid') || msg.includes('TOKEN_EXPIRED')) {
              setInviteExpired(true);
            } else {
              setLocalError(msg);
            }
            setInviteLoading(false);
          });
        return;
      }
      if (action === 'reset') {
        setCurrentView('RESET_CONFIRM');
        return;
      }
    }

    if (bootstrapStatus?.bootstrapRequired) {
      setCurrentView('BOOTSTRAP_WIZARD');
      if (bootstrapStatus.hasCompany && bootstrapStatus.company) {
        const c = bootstrapStatus.company as any;
        if (c.name) setCompanyName(c.name);
        if (c.ein) setEin(c.ein);
        if (c.stateTaxId) setStateTaxId(c.stateTaxId);
        if (c.address) setAddress(c.address);
        if (c.city) setCity(c.city);
        if (c.state) setState(c.state);
        if (c.zip) setZip(c.zip);
        if (c.payFrequency) setPayFrequency(c.payFrequency);
        if (c.stateFilingFrequency) setStateFilingFrequency(c.stateFilingFrequency);
        if (c.ownerEmail) {
          setCompanyEmail(c.ownerEmail);
          setEmail(c.ownerEmail);
        }
      }
    }
  }, [bootstrapStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-pulse">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-900 dark:text-white">Verifying Identity...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Connecting to Secure Session Store</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authorized with an active company membership, render the application
  if (isAuthorized) {
    return <>{children}</>;
  }

  // If user is signed in but membership is inactive or missing
  if (user && !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xl max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Your account ({user.email}) does not have an active membership in this company.
          </p>

          <button
            onClick={() => signOut()}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-slate-900 dark:text-white dark:text-slate-900 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Try Another Account</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 1 to Step 2 Transition (in Bootstrap Wizard)
  const handleBootstrapNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!companyName.trim()) {
      setLocalError('Company Name is required to proceed.');
      return;
    }

    if (!isValidEin(ein)) {
      setLocalError('Please enter a valid 9-digit Federal EIN (e.g. 12-3456789).');
      return;
    }

    // Default the owner email from company email if not already set
    if (!email && companyEmail) {
      setEmail(companyEmail);
    }

    setBootstrapStep(2);
  };

  // Step 2 Submission (Atomic Bootstrap: Company + Owner + Session)
  const handleBootstrapFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    const targetEmail = email.trim() || companyEmail.trim();

    if (!targetEmail || !password) {
      setLocalError('Owner email and password are required.');
      return;
    }
    if (!isValidEmail(targetEmail)) {
      setLocalError('Please enter a valid owner email address (e.g. owner@example.com).');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await bootstrapSystem({
        companyName,
        ein: formatEin(ein),
        stateTaxId,
        address,
        city,
        state,
        zip,
        companyEmail: companyEmail || targetEmail,
        stateFilingFrequency,
        payFrequency,
        email: targetEmail,
        password,
        confirmPassword,
        displayName: displayName || undefined,
      });
    } catch (err: any) {
      setLocalError(err.message || 'Failed to complete setup.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email || !password) {
      setLocalError('Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await signInEmail(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email) {
      setLocalError('Please enter your email address.');
      return;
    }

    try {
      setSubmitting(true);
      await resetPassword(email);
      setSuccessMsg('If an account exists with this email, password reset instructions have been dispatched.');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to submit reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!password || !confirmPassword) {
      setLocalError('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await confirmPasswordReset(urlToken || '', password, confirmPassword);
      setSuccessMsg('Password updated successfully! You may now sign in.');
      if (result?.email) {
        setEmail(result.email);
      }
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      setCurrentView('SIGN_IN');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (hasExistingAccount) {
      if (!password) {
        setLocalError('Please enter your existing account password.');
        return;
      }
    } else {
      if (!password || !confirmPassword) {
        setLocalError('Please enter and confirm your password.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters.');
        return;
      }
    }

    try {
      setSubmitting(true);
      await acceptInvitation(urlToken || '', password, hasExistingAccount ? password : confirmPassword, displayName);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to accept invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative font-sans">
      {/* Theme Switcher in top right corner */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          <span>{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</span>
        </button>
      </div>

      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
          {/* Header Badge & Title */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 mb-2">
              Multi-State Tax & Payroll
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-900 dark:text-white tracking-tight">
              TaxShield Ledger
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Self-Hosted Financial Ledger & Audit Trail
            </p>
          </div>

          {/* Feedback alerts */}
          {(localError || authError) && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[11px]">{localError || authError}</p>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px]">{successMsg}</p>
            </div>
          )}

          {/* VIEW: BOOTSTRAP WIZARD (Step 1: Company Setup, Step 2: Owner Password) */}
          {currentView === 'BOOTSTRAP_WIZARD' && (
            <div className="mt-5">
              {/* Step indicator bar */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
    bootstrapStep === 1
      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
  }`}>
                    1
                  </div>
                  <span className={`text-xs font-semibold ${bootstrapStep === 1 ? 'text-slate-900 dark:text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    Company Setup
                  </span>
                </div>
                <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-2">
<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
    bootstrapStep === 2
      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
  }`}>
                    2
                  </div>
                  <span className={`text-xs font-semibold ${bootstrapStep === 2 ? 'text-slate-900 dark:text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    Owner Account
                  </span>
                </div>
              </div>

              {/* STEP 1 FORM: COMPANY REGISTRATION */}
              {bootstrapStep === 1 && (
                <form onSubmit={handleBootstrapNextStep} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-300">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      <span>Step 1: Register Your Company</span>
                    </div>
                    <p className="text-[11px] text-indigo-800 dark:text-indigo-400">
                      Configure your company identity, business address, and payroll/tax schedules before setting owner credentials.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Your Business Name LLC"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Federal EIN *</label>
                      <input
                        type="text"
                        required
                        value={ein}
                        onChange={(e) => setEin(e.target.value)}
                        placeholder="12-3456789"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State Tax ID</label>
                      <input
                        type="text"
                        value={stateTaxId}
                        onChange={(e) => setStateTaxId(e.target.value)}
                        placeholder="e.g. 12345678"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Contact Email (Default Owner Email) *</label>
                    <input
                      type="email"
                      required
                      value={companyEmail}
                      onChange={(e) => {
                        setCompanyEmail(e.target.value);
                        if (!email) setEmail(e.target.value);
                      }}
                      placeholder="owner@my-llc.tax"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Business Address Section */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Company Street Address *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="100 Main Street, Suite 400"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Philadelphia"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Supported State *
                        </label>
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          {SUPPORTED_STATES.map((st) => (
                            <option key={st.code} value={st.code}>
                              {st.code} — {st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ZIP Code *</label>
                        <input
                          type="text"
                          required
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          placeholder="19102"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Supported State Tax Rules Context */}
                    {(() => {
                      const stateMeta = getSupportedStateByCode(state);
                      return stateMeta ? (
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">✓ Active Tax Rules:</span>
                          <span className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">{stateMeta.taxDescription}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Schedules Section */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Payroll Schedule *</span>
                      </label>
                      <select
                        value={payFrequency}
                        onChange={(e) => setPayFrequency(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="BI_WEEKLY">Bi-Weekly (26 Pay Periods/yr)</option>
                        <option value="WEEKLY">Weekly (52 Pay Periods/yr)</option>
                        <option value="SEMI_MONTHLY">Semi-Monthly (24 Pay Periods/yr)</option>
                        <option value="MONTHLY">Monthly (12 Pay Periods/yr)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Tax Filing Schedule *</span>
                      </label>
                      <select
                        value={stateFilingFrequency}
                        onChange={(e) => setStateFilingFrequency(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="MONTHLY">Monthly Remittance</option>
                        <option value="QUARTERLY">Quarterly Remittance</option>
                        <option value="SEMI_MONTHLY">Semi-Monthly High Volume</option>
                        <option value="ANNUALLY">Annual Reconciliation</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Next: Set Owner Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 2 FORM: OWNER PASSWORD SETUP */}
              {bootstrapStep === 2 && (
                <form onSubmit={handleBootstrapFinalSubmit} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-300">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Step 2: Create Managing Owner Account</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                      Set your owner password. All subsequent users will be invite-only employees.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Managing Owner Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email || companyEmail}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@my-llc.tax"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Pre-filled from company contact email. You can change it if you use a separate login email.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jane Doe (Managing Member)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password (min 8 chars) *</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm Password *</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setBootstrapStep(1); setLocalError(null); }}
                      className="w-1/3 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-2/3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-slate-900 dark:text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{submitting ? 'Creating System...' : 'Complete & Open Ledger'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* VIEW: STANDARD SIGN IN */}
          {currentView === 'SIGN_IN' && (
            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Company Ledger Sign In</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Authorized Managing Members & Invited Employees
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@micro-llc.tax"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setCurrentView('RESET_REQUEST'); setLocalError(null); setSuccessMsg(null); }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-slate-900 dark:text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Authenticating...' : 'Sign In with Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD REQUEST */}
          {currentView === 'RESET_REQUEST' && (
            <form onSubmit={handleResetRequestSubmit} className="mt-5 space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300">
                <p className="font-semibold">Reset Your Password</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                  Enter your registered account email. A secure, single-use password reset link will be sent to your inbox.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@micro-llc.tax"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Dispatching Link...' : 'Send Password Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => { setCurrentView('SIGN_IN'); setLocalError(null); setSuccessMsg(null); }}
                className="w-full py-2 text-center text-xs text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* VIEW: RESET CONFIRM */}
          {currentView === 'RESET_CONFIRM' && (
            <form onSubmit={handleResetConfirmSubmit} className="mt-5 space-y-3.5">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-300">
                <p className="font-semibold">Set New Password</p>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-400 mt-0.5">
                  Enter your new password below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Set New Password & Return to Login'}
              </button>
            </form>
          )}

          {/* VIEW: ACCEPT INVITATION - LOADING STATE */}
          {currentView === 'ACCEPT_INVITE' && inviteLoading && (
            <div className="mt-5 p-6 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-pulse">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Verifying employee invitation...
              </p>
            </div>
          )}

          {/* VIEW: ACCEPT INVITATION - EXPIRED OR ALREADY USED (ZERO DATA LEAKAGE) */}
          {currentView === 'ACCEPT_INVITE' && !inviteLoading && inviteExpired && (
            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Invitation Expired or Already Used
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">
                  This invitation link is no longer valid or has already been accepted. For security, no account information is displayed.
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-2">
                  Please contact your company administrator to request a new invitation link.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentView('SIGN_IN');
                  setLocalError(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-slate-900 dark:text-white dark:text-slate-900 font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </button>
            </div>
          )}

          {/* VIEW: ACCEPT INVITATION - ACTIVE / VALID FORM */}
          {currentView === 'ACCEPT_INVITE' && !inviteLoading && !inviteExpired && (
            <form onSubmit={handleAcceptInviteSubmit} className="mt-5 space-y-3.5">
              {hasExistingAccount ? (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-300">
                  <p className="font-semibold">Welcome Back!</p>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-400 mt-0.5">
                    You have been invited to join <span className="font-semibold">{inviteCompanyName || 'this company'}</span>. Since you already have an account, enter your password to accept the invitation and link your account to this company.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-300">
                  <p className="font-semibold">Employee Invitation</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
                    You have been invited to join <span className="font-semibold">{inviteCompanyName || 'this company'}</span>. Set your password to complete registration.
                  </p>
                </div>
              )}

              {/* Read-Only Prepopulated Employee Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee Full Name
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={displayName}
                    placeholder="Employee Name"
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium cursor-not-allowed select-all focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pre-populated from company staff records (read-only).
                </p>
              </div>

              {/* Read-Only Prepopulated Email ID / User ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  User ID / Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    readOnly
                    tabIndex={-1}
                    value={email}
                    placeholder="employee@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono cursor-not-allowed select-all focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Your permanent sign-in identity for this company ledger (read-only).
                </p>
              </div>

              {hasExistingAccount ? (
                /* Existing User: Single Password Input to Authenticate & Join */
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Account Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => { setCurrentView('RESET_REQUEST'); setLocalError(null); }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                /* New User: Create and Confirm New Password */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password (min 8 chars) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 px-4 rounded-xl text-slate-900 dark:text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                  hasExistingAccount
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {submitting
                    ? (hasExistingAccount ? 'Verifying & Joining...' : 'Activating Account...')
                    : (hasExistingAccount ? 'Sign In & Accept Invitation' : 'Accept Invitation & Enter Ledger')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setCurrentView('SIGN_IN'); setLocalError(null); setSuccessMsg(null); }}
                className="w-full py-2 text-center text-xs text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
              >
                Already accepted or have an account? Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
