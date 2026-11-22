import React, { useState } from 'react';
import { ExternalLink, Copy, Check, CheckCircle2 } from 'lucide-react';
import { Federal941BundleSummary } from '../../types';

export interface ConciergeFederal941CardProps {
  bundle: Federal941BundleSummary | null;
  onSettle: (confirmationNumber: string) => Promise<void>;
}

export function ConciergeFederal941Card({ bundle, onSettle }: ConciergeFederal941CardProps) {
  const [copied, setCopied] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const copyTXP = () => {
    if (!bundle?.txpAddenda) return;
    navigator.clipboard.writeText(bundle.txpAddenda);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkSettled = async () => {
    if (!confirmationNumber.trim()) return;
    setSubmitting(true);
    try {
      await onSettle(confirmationNumber.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono font-bold">
            2
          </span>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Federal Form 941 Tax Deposit</h3>
        </div>
        <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
          ${bundle?.totalAmount.toFixed(2) || '0.00'}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Includes FIT withholding + Employee & Employer Social Security + Medicare. Due on{' '}
        {bundle?.statutoryDueDate || '15th of next month'}.
      </p>

      {bundle?.isSettled ? (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4" /> Settled via EFTPS
          </span>
          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
            Conf: {bundle.confirmationNumber}
          </span>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {bundle?.txpAddenda && (
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>EFTPS CCD+ TXP Addenda String</span>
                <button
                  type="button"
                  onClick={copyTXP}
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy TXP'}
                </button>
              </div>
              <p className="font-mono text-[11px] break-all select-all text-slate-800 dark:text-slate-200">
                {bundle.txpAddenda}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <a
              href="https://www.eftps.gov/eftps/"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-semibold text-[11px] flex items-center gap-1 hover:bg-indigo-100 transition shrink-0"
            >
              <span>Open EFTPS.gov</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <input
              type="text"
              placeholder="EFTPS Confirmation #"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              className="glass-input border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs flex-1 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="button"
              disabled={submitting || !confirmationNumber.trim()}
              onClick={handleMarkSettled}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-[11px] transition cursor-pointer shadow-xs shrink-0"
            >
              {submitting ? 'Saving...' : 'Mark Settled'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
