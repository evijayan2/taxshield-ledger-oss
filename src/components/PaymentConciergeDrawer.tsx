import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  decomposePayStubsToLiabilities,
  buildFederal941Bundle,
  buildStateRemittanceSummaries,
  type TaxFilingUploadTemplateRecord,
} from 'taxshield-ledger-core';
import {
  PayrollRun,
  PayStub,
  Employee,
  Organization,
  Federal941BundleSummary,
  StateRemittanceSummary,
} from '../types';
import { ConciergeDisburseCard } from './concierge/ConciergeDisburseCard';
import { ConciergeFederal941Card } from './concierge/ConciergeFederal941Card';
import { ConciergeStateCard } from './concierge/ConciergeStateCard';

export interface PaymentConciergeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  payrollRun: PayrollRun | null;
  payStubs: PayStub[];
  employees: Employee[];
  company: Organization;
  onUpdateStubDisbursement?: (stubId: string, achRef: string) => void;
  onLiabilitySettled?: () => void;
}

export function PaymentConciergeDrawer({
  isOpen,
  onClose,
  payrollRun,
  payStubs,
  employees,
  company,
  onUpdateStubDisbursement,
  onLiabilitySettled,
}: PaymentConciergeDrawerProps) {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [federalBundle, setFederalBundle] = useState<Federal941BundleSummary | null>(null);
  const [stateRemittances, setStateRemittances] = useState<StateRemittanceSummary[]>([]);
  const [uploadTemplates, setUploadTemplates] = useState<TaxFilingUploadTemplateRecord[]>([]);

  const fallbackSummary = useMemo(() => {
    if (!payrollRun) return { federalBundle: null, stateRemittances: [] as StateRemittanceSummary[] };
    const runStubs = payStubs.filter((s) => s.payrollRunId === payrollRun.id);
    const decomposed = decomposePayStubsToLiabilities({
      companyId: company.id,
      payrollRunId: payrollRun.id,
      payDate: payrollRun.payDate,
      periodEnd: payrollRun.periodEnd,
      companyState: company.state,
      payStubs: runStubs as any,
    });
    return {
      federalBundle: buildFederal941Bundle(decomposed, company.ein || '', payrollRun.periodEnd),
      stateRemittances: buildStateRemittanceSummaries(decomposed, { stateTaxId: company.stateTaxId }),
    };
  }, [payrollRun, payStubs, company.id, company.state, company.ein, company.stateTaxId]);

  useEffect(() => {
    if (!isOpen || !payrollRun) return;
    setFeedback(null);
    setFederalBundle(fallbackSummary.federalBundle);
    setStateRemittances(fallbackSummary.stateRemittances);

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const loadLiabilities = (attempt: number) => {
      fetch(`/api/companies/${company.id}/payroll-runs/${payrollRun.id}/liabilities`)
        .then(async (res) => ({ status: res.status, data: await res.json() }))
        .then(({ status, data }) => {
          if (cancelled) return;
          if (data.success) {
            if (data.federalBundle) setFederalBundle(data.federalBundle);
            if (Array.isArray(data.stateRemittances)) setStateRemittances(data.stateRemittances);
          } else if (status === 404 && attempt < 3) {
            // Newly created runs are persisted via an 800ms debounced save; retry briefly before surfacing 404.
            retryTimer = setTimeout(() => loadLiabilities(attempt + 1), 1000);
          } else if (data.error) {
            setFeedback({ type: 'error', message: data.error });
          }
        })
        .catch((err) => {
          if (!cancelled) setFeedback({ type: 'error', message: err.message });
        });
    };

    loadLiabilities(0);

    fetch(`/api/companies/${company.id}/upload-templates`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && Array.isArray(data.templates)) {
          setUploadTemplates(data.templates);
        }
      })
      .catch(() => {});

    const handleDownloadUploadExport = async (portalKey: string) => {
    const runStubs = payStubs.filter((s) => s.payrollRunId === payrollRun.id);
    const res = await fetch(`/api/companies/${company.id}/payroll-runs/${payrollRun.id}/upload-export/${portalKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payrollRun,
        payStubs: runStubs,
        employees,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      setFeedback({ type: 'error', message: data.error || 'Failed to generate upload file.' });
      return;
    }
    const blob = new Blob([data.content], { type: data.mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.fileName;
    a.click();
    URL.revokeObjectURL(url);
    const warnText = Array.isArray(data.warnings) && data.warnings.length > 0 ? ` (${data.warnings[0]})` : '';
    setFeedback({ type: 'success', message: `Downloaded ${data.fileName}${warnText}` });
  };

  return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isOpen, payrollRun, company.id, fallbackSummary]);

  if (!isOpen || !payrollRun) return null;

  const handleSettleFederal = async (conf: string) => {
    if (!federalBundle) return;
    const res = await fetch(`/api/companies/${company.id}/tax-liabilities/settle-bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liabilityIds: federalBundle.liabilityIds, confirmationNumber: conf }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    setFederalBundle({ ...federalBundle, isSettled: true, confirmationNumber: conf });
    setFeedback({ type: 'success', message: 'Federal 941 deposit marked as settled!' });
    onLiabilitySettled?.();
  };

  const handleSettleState = async (liabilityId: string, conf: string) => {
    const res = await fetch(`/api/companies/${company.id}/tax-liabilities/${liabilityId}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationNumber: conf }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    setStateRemittances((prev) =>
      prev.map((s) => (s.liabilityId === liabilityId ? { ...s, isSettled: true, confirmationNumber: conf } : s))
    );
    setFeedback({ type: 'success', message: 'State tax liability marked as settled!' });
    onLiabilitySettled?.();
  };

  const handleDownloadUploadExport = async (portalKey: string) => {
    const runStubs = payStubs.filter((s) => s.payrollRunId === payrollRun.id);
    const res = await fetch(`/api/companies/${company.id}/payroll-runs/${payrollRun.id}/upload-export/${portalKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payrollRun,
        payStubs: runStubs,
        employees,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      setFeedback({ type: 'error', message: data.error || 'Failed to generate upload file.' });
      return;
    }
    const blob = new Blob([data.content], { type: data.mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.fileName;
    a.click();
    URL.revokeObjectURL(url);
    const warnText = Array.isArray(data.warnings) && data.warnings.length > 0 ? ` (${data.warnings[0]})` : '';
    setFeedback({ type: 'success', message: `Downloaded ${data.fileName}${warnText}` });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
        <div className="glass-panel w-full border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-6 text-xs text-slate-900 dark:text-slate-100">
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payroll Payment Concierge</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-semibold">
                  3-Min Routine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Disburse salaries and remit statutory liabilities without paid payroll intermediaries.
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          {feedback && (
            <div className={`p-3 rounded-xl flex items-center justify-between text-xs ${feedback.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'}`}>
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold">✕</button>
            </div>
          )}

          <ConciergeDisburseCard
            payrollRun={payrollRun}
            payStubs={payStubs}
            employees={employees}
            company={company}
            onUpdateStubDisbursement={onUpdateStubDisbursement}
          />

          <ConciergeFederal941Card
            bundle={federalBundle}
            onSettle={handleSettleFederal}
          />

          <ConciergeStateCard
            remittances={stateRemittances}
            onSettle={handleSettleState}
            uploadTemplates={uploadTemplates}
            onDownloadUploadExport={handleDownloadUploadExport}
          />
        </div>
      </div>
    </div>
  );
}
