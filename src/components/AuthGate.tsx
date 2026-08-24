import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  ArrowRight, 
  LogOut, 
  UserCheck, 
  Sun, 
  Moon,
  Mail,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type AuthTab = 'GOOGLE' | 'EMAIL';
type EmailMode = 'SIGN_IN' | 'SIGN_UP' | 'RESET';

/**
 * Access Gate component providing Google Auth and Email/Password Auth.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { 
    user, 
    loading, 
    isAuthorized, 
    authorizedEmail, 
    authError, 
    clearAuthError, 
    signIn, 
    signInEmail,
    signUpEmail,
    resetPassword,
    signOut, 
    setDevBypass 
  } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<AuthTab>('GOOGLE');
  const [emailMode, setEmailMode] = useState<EmailMode>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-pulse">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Verifying Identity...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Connecting to Authentication System</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authorized, render application
  if (isAuthorized) {
    return <>{children}</>;
  }

  // If user is signed in with an unauthorized email
  if (user && !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-xs flex items-center gap-1.5"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xl max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            Single-Tenant Owner Security Policy Enforced
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Signed In As:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400 truncate max-w-[200px]">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Authorized Owner:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{authorizedEmail || 'Setup Pending'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            This private ledger contains confidential corporate tax records, payroll distributions, and IRS compliance data. Access is strictly limited to managing member <strong className="text-slate-900 dark:text-slate-200">{authorizedEmail}</strong>.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => signIn()}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Switch Account</span>
            </button>

            <button
              onClick={() => signOut()}
              className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const switchEmailMode = (mode: EmailMode) => {
    setEmailMode(mode);
    setFormError(null);
    setSuccessMsg(null);
    clearAuthError();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!email || (!password && emailMode !== 'RESET')) {
      setFormError('Please fill out all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      if (emailMode === 'SIGN_IN') {
        await signInEmail(email, password);
      } else if (emailMode === 'SIGN_UP') {
        await signUpEmail(email, password);
        setSuccessMsg('Account created successfully!');
      } else if (emailMode === 'RESET') {
        await resetPassword(email);
        setSuccessMsg(`Password reset email dispatched to ${email}. Check your inbox or spam folder.`);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Authentication operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Not signed in view
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative font-sans">
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

      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 mb-2">
              PA & IRS Micro-LLC
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              TaxShield Ledger
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Autonomous 5-Point Mileage, Assisted Payroll & Tax Management
            </p>
          </div>

          {/* Access Policy Notice */}
          <div className="my-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Security Whitelist</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                {authorizedEmail 
                  ? <>Restricted to authorized owner <strong className="font-mono text-amber-950 dark:text-amber-200">{authorizedEmail}</strong></> 
                  : <>Company setup pending — initial login establishes managing owner email.</>}
              </p>
            </div>
          </div>

          {/* Auth Method Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-5 text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('GOOGLE'); clearAuthError(); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'GOOGLE' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Google Auth
            </button>
            <button
              onClick={() => { setActiveTab('EMAIL'); clearAuthError(); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'EMAIL' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Email & Password
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[11px]">{authError}</p>
            </div>
          )}

          {activeTab === 'GOOGLE' ? (
            <button
              id="google-signin-button"
              onClick={() => signIn()}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                  {formError}
                </div>
              )}
              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={authorizedEmail || 'owner@micro-llc.tax'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              {emailMode !== 'RESET' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting 
                  ? 'Processing...' 
                  : emailMode === 'SIGN_IN' 
                    ? 'Sign In with Email' 
                    : emailMode === 'SIGN_UP' 
                      ? 'Create Email Account' 
                      : 'Send Reset Link'}
              </button>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {emailMode === 'SIGN_IN' ? (
                  <>
                    <button type="button" onClick={() => switchEmailMode('SIGN_UP')} className="hover:underline text-emerald-600 dark:text-emerald-400 cursor-pointer">
                      Need an account? Sign Up
                    </button>
                    <button type="button" onClick={() => switchEmailMode('RESET')} className="hover:underline cursor-pointer">
                      Forgot Password?
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => switchEmailMode('SIGN_IN')} className="hover:underline text-emerald-600 dark:text-emerald-400 cursor-pointer">
                    Back to Sign In
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Browser preview:</span>
            <button
              onClick={() => setDevBypass(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              Enter Sandbox Mode ({authorizedEmail || 'Owner'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

