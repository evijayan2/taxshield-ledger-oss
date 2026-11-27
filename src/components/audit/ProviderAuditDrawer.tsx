import React, { useState } from 'react';
import { Sparkles, X, UploadCloud, CheckCircle2, AlertCircle, FileCheck2, ArrowRight, Download } from 'lucide-react';
import type { Organization, ProviderAuditReport } from '../../types';
import { ProviderVarianceTable } from './ProviderVarianceTable';

export interface ProviderAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  company: Organization;
  onRunCreated?: () => void;
}

const GUSTO_SAMPLE = `Employee,Check Date,Period Start,Period End,Gross Pay,Federal Income Tax,Social Security,Medicare,State Tax,Local Tax,Net Pay
"Alice Walker",2026-08-15,2026-08-01,2026-08-15,$3000.00,$350.00,$186.00,$43.50,$92.10,$30.00,$2298.40
"Bob Martinez",2026-08-15,2026-08-01,2026-08-15,$2500.00,$260.00,$155.00,$36.25,$76.75,$25.00,$1947.00`;

const QBO_SAMPLE = `Employee,Pay Date,Pay Period Start,Pay Period End,Total Pay,Federal Withholding,Social Security Employee,Medicare Employee,State Withholding,Net Pay
"Alice Walker",2026-09-01,2026-08-16,2026-08-31,$3000.00,$350.00,$186.00,$43.50,$92.10,$2328.40`;

export function ProviderAuditDrawer({ isOpen, onClose, company, onRunCreated }: ProviderAuditDrawerProps) {
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ProviderAuditReport | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (rawCsv: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/companies/${company.id}/provider-audit/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent: rawCsv }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze payroll register.');
      setReport(data.report);
      setFeedback({ type: 'success', message: `Audit completed! Analyzed ${data.report.comparisons.length} payroll rows.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!report) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${company.id}/provider-audit/convert-to-runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to backfill historical run.');
      setFeedback({ type: 'success', message: 'Verified historical payroll run backfilled to ledger!' });
      onRunCreated?.();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provider_audit_report_${report.provider.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-3xl w-full flex">
        <div className="glass-panel w-full border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-6 text-xs text-slate-900 dark:text-slate-100">
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Verify Your Provider (Payroll Audit)
                </h2>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Audit past Gusto or QuickBooks payroll registers against TaxShield's sealed rules engine.
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl flex items-center justify-between text-xs ${feedback.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'}`}>
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold">✕</button>
            </div>
          )}

          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-500" /> Paste or Upload Payroll Register CSV
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setCsvContent(GUSTO_SAMPLE); handleAnalyze(GUSTO_SAMPLE); }}
                  className="px-2 py-1 text-[11px] rounded font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Load Gusto Sample
                </button>
                <button
                  type="button"
                  onClick={() => { setCsvContent(QBO_SAMPLE); handleAnalyze(QBO_SAMPLE); }}
                  className="px-2 py-1 text-[11px] rounded font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Load QBO Sample
                </button>
              </div>
            </div>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste raw CSV register here..."
              rows={4}
              className="glass-input w-full p-2.5 rounded-lg font-mono text-[11px] border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={loading || !csvContent.trim()}
                onClick={() => handleAnalyze(csvContent)}
                className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                {loading ? 'Analyzing Register...' : 'Run Variance Audit'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass-card p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Gross</span>
                  <p className="text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    ${report.totalGross.toFixed(2)}
                  </p>
                </div>
                <div className="glass-card p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Clean Matches</span>
                  <p className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {report.cleanCount}
                  </p>
                </div>
                <div className="glass-card p-3 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50/30 dark:bg-rose-950/20">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Discrepancies</span>
                  <p className="text-base font-mono font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                    {report.criticalCount + report.warningCount}
                  </p>
                </div>
                <div className="glass-card p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Variance</span>
                  <p className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    ${report.totalVariance.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-xs">
                    Reconciliation Comparison Results ({report.comparisons.length} lines)
                  </h3>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Audit JSON
                  </button>
                </div>
                <ProviderVarianceTable comparisons={report.comparisons} />
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
                <p className="text-[11px] text-slate-500">
                  Detected Dialect: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{report.provider}</span>
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConvert}
                  className="px-4 py-2 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  <FileCheck2 className="w-4 h-4" /> Import Verified Historical Run
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
