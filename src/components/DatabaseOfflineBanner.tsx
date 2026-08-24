import React, { useState } from 'react';
import { Database, AlertTriangle, RefreshCw, Terminal, ShieldAlert, CheckCircle2, Server } from 'lucide-react';
import { PostgresStatus } from '../utils/api';

interface DatabaseOfflineBannerProps {
  dbStatus: PostgresStatus | null;
  errorMessage?: string | null;
  onRetry: () => Promise<void>;
}

/**
 * Full-page / Modal banner presented when PostgreSQL database connection is unavailable or offline.
 * Enforces strict audit-trail compliance by preventing unpersisted browser fallback operations.
 */
export function DatabaseOfflineBanner({ dbStatus, errorMessage, onRetry }: DatabaseOfflineBannerProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const handleRetryClick = async () => {
    setIsRetrying(true);
    setRetryMessage(null);
    try {
      await onRetry();
    } catch (err: any) {
      setRetryMessage(`Retry failed: ${err.message || 'Still unable to reach database'}`);
    } finally {
      setIsRetrying(false);
    }
  };

  const detailedMessage = errorMessage || dbStatus?.message || dbStatus?.error || 'Unable to establish a secure connection to PostgreSQL database server.';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop blur */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200" />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-rose-500/30 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100">
          
          {/* Top Glow & Badge */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  PostgreSQL Service Offline
                </h2>
                <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
                  AUDIT GUARD ACTIVE • BROWSER FALLBACK DISABLED
                </span>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
              503 Service Unavailable
            </span>
          </div>

          {/* Core Message */}
          <div className="space-y-3 flex-1">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              TaxShield Ledger strictly requires a live <strong>PostgreSQL database</strong> connection to store immutable financial records, PA state withholding logs, and audit trails. Automatic browser storage fallback has been disabled to prevent compliance drift.
            </p>

            {/* Diagnostic Error Box */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-sans text-xs border-b border-slate-200 dark:border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <Server className="w-3.5 h-3.5 text-rose-500" />
                  Connection Diagnostics
                </span>
                <span>Host: {dbStatus?.host || 'localhost'}</span>
              </div>
              <p className="text-rose-600 dark:text-rose-400 font-semibold break-words leading-tight">
                {detailedMessage}
              </p>
            </div>
          </div>

          {/* Quick Resolution Help */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
              <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>How to Start Local PostgreSQL</span>
            </div>
            <p className="text-indigo-800 dark:text-indigo-300 text-xs">
              Run the following command in your terminal to start the local Postgres container:
            </p>
            <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-xs flex items-center justify-between select-all border border-slate-700">
              <span>docker compose up -d</span>
              <span className="text-[10px] text-slate-500 font-sans">Shell / Terminal</span>
            </div>
          </div>

          {/* Retry Failure Banner */}
          {retryMessage && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{retryMessage}</span>
            </div>
          )}

          {/* Action Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Listening on <code className="font-mono text-slate-700 dark:text-slate-300">/api/postgres/status</code>
            </span>

            <button
              onClick={handleRetryClick}
              disabled={isRetrying}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Checking Connection...' : 'Retry Connection Now'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
