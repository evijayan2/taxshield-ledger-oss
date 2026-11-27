import React, { useState } from 'react';
import { ExternalLink, Copy, Check, CheckCircle2, Download } from 'lucide-react';
import { SUPPORTED_UPLOAD_PORTALS, type TaxFilingUploadTemplateRecord } from 'taxshield-ledger-core';
import { StateRemittanceSummary } from '../../types';

export interface ConciergeStateCardProps {
  remittances: StateRemittanceSummary[];
  onSettle: (liabilityId: string, confirmationNumber: string) => Promise<void>;
  uploadTemplates?: TaxFilingUploadTemplateRecord[];
  onDownloadUploadExport?: (portalKey: string) => Promise<void>;
}

function findMatchingUploadTemplate(
  taxType: string,
  templates: TaxFilingUploadTemplateRecord[]
): TaxFilingUploadTemplateRecord | undefined {
  const upper = taxType.toUpperCase();
  const enabled = templates.filter((t) => t.isEnabled);
  if (upper.includes('EIT')) return enabled.find((t) => t.portalKey === 'PA_KEYSTONE_EIT');
  if (upper.includes('LST')) return enabled.find((t) => t.portalKey === 'PA_KEYSTONE_LST');
  if (upper.includes('SUTA') || upper.includes('UC')) return enabled.find((t) => t.portalKey === 'PA_UC_QUARTERLY');
  if (upper.includes('SIT') || upper.includes('PIT') || upper.includes('WITHHOLD')) {
    return enabled.find((t) => t.portalKey === 'PA_MYPATH_WITHHOLDING');
  }
  return enabled.find((t) => t.portalKey === 'CUSTOM');
}

export function ConciergeStateCard({
  remittances,
  onSettle,
  uploadTemplates = [],
  onDownloadUploadExport,
}: ConciergeStateCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confs, setConfs] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const copyTXP = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSettle = async (liabilityId: string) => {
    const conf = confs[liabilityId]?.trim();
    if (!conf) return;
    setLoadingId(liabilityId);
    try {
      await onSettle(liabilityId, conf);
    } finally {
      setLoadingId(null);
    }
  };

  const totalAmount = remittances.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-mono font-bold">
            3
          </span>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">State & Local Tax Remittance</h3>
        </div>
        <span className="font-mono text-sm font-bold text-teal-600 dark:text-teal-400">
          ${totalAmount.toFixed(2)}
        </span>
      </div>

      <div className="p-3 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
        <p className="font-bold text-teal-900 dark:text-teal-200">
          How to Pay PA State &amp; Local Taxes Manually Using Mercury (ACH Debit):
        </p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>
            <strong>PA PIT (3.07%):</strong> Click <strong>Portal</strong> (<code>mypath.pa.gov</code>) → <strong>Employer Withholding</strong> → <strong>Make a Payment</strong> → pay via ACH Debit using your Mercury checking routing &amp; account number.
          </li>
          <li>
            <strong>PA UC (SUTA / 0.07% EE):</strong> Click <strong>Portal</strong> (<code>uctax.pa.gov</code>) → file quarterly <strong>UC-2/UC-2A</strong> → pay via ACH Debit from Mercury.
          </li>
          <li>
            <strong>Local EIT / LST (Act 32):</strong> Log into your county Tax Collector (e.g.,{' '}
            <a
              href="https://business.KeystoneCollects.com/"
              target="_blank"
              rel="noreferrer"
              className="underline font-semibold text-teal-700 dark:text-teal-300"
            >
              business.KeystoneCollects.com
            </a>
            , Berkheimer, Jordan) → file quarterly return (or upload CSV) for your PSD code → pay via ACH Debit from Mercury.
          </li>
          <li>
            Paste each portal&apos;s <strong>Confirmation #</strong> below and click <strong>Mark Paid</strong>.
          </li>
        </ol>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800 pt-1">
        {uploadTemplates.some((t) => t.isEnabled) && onDownloadUploadExport && (
          <div className="pb-3 mb-2 space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Configured Portal Upload Files
            </p>
            <div className="flex flex-wrap gap-2">
              {uploadTemplates
                .filter((t) => t.isEnabled)
                .map((tpl) => {
                  const portalMeta = SUPPORTED_UPLOAD_PORTALS.find((p) => p.portalKey === tpl.portalKey);
                  return (
                    <div key={tpl.portalKey} className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={downloadingKey === tpl.portalKey}
                        onClick={async () => {
                          setDownloadingKey(tpl.portalKey);
                          try {
                            await onDownloadUploadExport(tpl.portalKey);
                          } finally {
                            setDownloadingKey(null);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-semibold text-[10px] inline-flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                      >
                        <Download className="w-3 h-3" />
                        <span>
                          {downloadingKey === tpl.portalKey
                            ? 'Generating...'
                            : `Download ${tpl.portalLabel} (${tpl.fileFormat})`}
                        </span>
                      </button>
                      {portalMeta?.portalUrl && (
                        <a
                          href={portalMeta.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 font-semibold text-[10px] inline-flex items-center gap-1 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        {remittances.length === 0 ? (
          <p className="text-[11px] text-slate-400 py-2">No state or local taxes due for this run.</p>
        ) : (
          remittances.map((rem) => (
            <div key={rem.liabilityId} className="py-2.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{rem.taxType}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                    Due: {rem.statutoryDueDate} • Portal: {rem.portalName}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  ${rem.amount.toFixed(2)}
                </span>
              </div>

              {rem.txpAddenda && !rem.isSettled && (
                <div className="p-2 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{rem.taxType} State TXP Addenda String</span>
                    <button
                      type="button"
                      onClick={() => copyTXP(rem.txpAddenda!, rem.liabilityId)}
                      className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
                    >
                      {copiedId === rem.liabilityId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === rem.liabilityId ? 'Copied!' : 'Copy TXP'}
                    </button>
                  </div>
                  <p className="font-mono text-[10px] break-all select-all text-slate-800 dark:text-slate-200">
                    {rem.txpAddenda}
                  </p>
                </div>
              )}

              {rem.isSettled ? (
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                  </span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    Conf: {rem.confirmationNumber}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  {(() => {
                    const tpl = findMatchingUploadTemplate(rem.taxType, uploadTemplates);
                    const portalMeta = tpl
                      ? SUPPORTED_UPLOAD_PORTALS.find((p) => p.portalKey === tpl.portalKey)
                      : undefined;
                    const resolvedUrl = portalMeta?.portalUrl || rem.portalUrl;
                    return (
                      <a
                        href={resolvedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 font-semibold text-[10px] flex items-center gap-1 hover:bg-teal-100 transition shrink-0"
                      >
                        <span>Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    );
                  })()}
                  <input
                    type="text"
                    placeholder="Confirmation #"
                    value={confs[rem.liabilityId] || ''}
                    onChange={(e) => setConfs({ ...confs, [rem.liabilityId]: e.target.value })}
                    className="glass-input border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none focus:border-teal-500 font-mono"
                  />
                  <button
                    type="button"
                    disabled={loadingId === rem.liabilityId || !confs[rem.liabilityId]?.trim()}
                    onClick={() => handleSettle(rem.liabilityId)}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-[10px] transition cursor-pointer shadow-xs shrink-0"
                  >
                    {loadingId === rem.liabilityId ? 'Saving...' : 'Mark Paid'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
