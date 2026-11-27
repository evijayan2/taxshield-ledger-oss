import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';
import {
  SUPPORTED_UPLOAD_PORTALS,
  parseTaxUploadTemplate,
  type TaxFilingUploadTemplateRecord,
  type UploadFileFormat,
  type UploadPortalKey,
} from 'taxshield-ledger-core';

interface TaxUploadTemplatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  defaultPsdCode?: string;
  onSaved?: () => void;
}

/**
 * Slide-over drawer for configuring per-portal electronic tax upload options
 * and storing user-provided template files (e.g., PA Keystone EIT/LST CSV or MMREF-1).
 */
export const TaxUploadTemplatesDrawer: React.FC<TaxUploadTemplatesDrawerProps> = ({
  isOpen,
  onClose,
  companyId,
  defaultPsdCode = '',
  onSaved,
}) => {
  const [templates, setTemplates] = useState<TaxFilingUploadTemplateRecord[]>([]);
  const [selectedPortalKey, setSelectedPortalKey] = useState<UploadPortalKey>('PA_KEYSTONE_EIT');
  const [customPortalLabel, setCustomPortalLabel] = useState('');
  const [fileFormat, setFileFormat] = useState<UploadFileFormat>('CSV');
  const [isEnabled, setIsEnabled] = useState(true);
  const [templateFileName, setTemplateFileName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [businessLocationPsd, setBusinessLocationPsd] = useState(defaultPsdCode);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedPortal = useMemo(
    () => SUPPORTED_UPLOAD_PORTALS.find((p) => p.portalKey === selectedPortalKey) ?? SUPPORTED_UPLOAD_PORTALS[0],
    [selectedPortalKey]
  );

  const existingRecord = useMemo(
    () => templates.find((t) => t.portalKey === selectedPortalKey),
    [templates, selectedPortalKey]
  );

  const parsedPreview = useMemo(() => {
    if (!templateContent.trim() || !templateFileName.trim()) return null;
    try {
      return parseTaxUploadTemplate(templateFileName, templateContent, fileFormat);
    } catch {
      return null;
    }
  }, [templateFileName, templateContent, fileFormat]);

  const syncFormFromRecord = useCallback(
    (portalKey: UploadPortalKey, list: TaxFilingUploadTemplateRecord[]) => {
      const match = list.find((t) => t.portalKey === portalKey);
      const portalMeta = SUPPORTED_UPLOAD_PORTALS.find((p) => p.portalKey === portalKey);
      setConfirmRemove(false);
      setError(null);
      if (match) {
        setCustomPortalLabel(match.portalLabel);
        setFileFormat((match.fileFormat as UploadFileFormat) || portalMeta?.defaultFormat || 'CSV');
        setIsEnabled(match.isEnabled);
        setTemplateFileName(match.templateFileName);
        setTemplateContent(match.templateContent);
        setBusinessLocationPsd(match.businessLocationPsd || defaultPsdCode);
        setNotes(match.notes || '');
      } else {
        setCustomPortalLabel(portalMeta?.portalLabel || '');
        setFileFormat(portalMeta?.defaultFormat || 'CSV');
        setIsEnabled(true);
        setTemplateFileName('');
        setTemplateContent('');
        setBusinessLocationPsd(defaultPsdCode);
        setNotes('');
      }
    },
    [defaultPsdCode]
  );

  const loadTemplates = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/upload-templates`);
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setTemplates(data.templates);
        syncFormFromRecord(selectedPortalKey, data.templates);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load upload templates.');
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedPortalKey, syncFormFromRecord]);

  useEffect(() => {
    if (isOpen) {
      setSuccessMsg(null);
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  if (!isOpen) return null;

  const handleSelectPortal = (key: UploadPortalKey) => {
    setSelectedPortalKey(key);
    setSuccessMsg(null);
    syncFormFromRecord(key, templates);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result ?? '');
      try {
        const parsed = parseTaxUploadTemplate(file.name, text);
        setTemplateFileName(file.name);
        setTemplateContent(text);
        setFileFormat(parsed.fileFormat);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Invalid template file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (isEnabled && (!templateFileName.trim() || !templateContent.trim())) {
      setError('Please upload a template file before enabling this upload option.');
      return;
    }

    setSaving(true);
    try {
      const label = selectedPortalKey === 'CUSTOM' && customPortalLabel.trim()
        ? customPortalLabel.trim()
        : selectedPortal.portalLabel;

      const res = await fetch(`/api/companies/${companyId}/upload-templates/${selectedPortalKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalLabel: label,
          jurisdiction: selectedPortal.jurisdiction,
          fileFormat,
          isEnabled,
          templateFileName,
          templateContent,
          businessLocationPsd,
          notes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save upload template.');

      setSuccessMsg(`Saved ${label} template (${templateFileName}).`);
      await loadTemplates();
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save upload template.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/upload-templates/${selectedPortalKey}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to remove template.');
      setConfirmRemove(false);
      setSuccessMsg('Upload template removed.');
      await loadTemplates();
      onSaved?.();
    } catch (err: any) {
      setError(err.message || 'Failed to remove template.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
        <div className="glass-panel w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-5 text-xs text-slate-900 dark:text-slate-100">
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Electronic Tax Filing Upload Templates
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enable file-upload portals (e.g. Keystone EIT/LST) and attach your portal template file.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUPPORTED_UPLOAD_PORTALS.map((portal) => {
              const configured = templates.find((t) => t.portalKey === portal.portalKey);
              const active = portal.portalKey === selectedPortalKey;
              return (
                <button
                  key={portal.portalKey}
                  type="button"
                  onClick={() => handleSelectPortal(portal.portalKey)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs truncate">{portal.portalLabel}</span>
                    {configured?.isEnabled && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {portal.description}
                  </p>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selectedPortal.portalLabel}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-0.5">
                  {selectedPortal.portalUrl && (
                    <a
                      href={selectedPortal.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Open Upload Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedPortal.specUrl && (
                    <a
                      href={selectedPortal.specUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Official Electronic File Specifications</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Enable Upload</span>
              </label>
            </div>

            {selectedPortalKey === 'CUSTOM' && (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Custom Portal Name *</label>
                <input
                  type="text"
                  required
                  value={customPortalLabel}
                  onChange={(e) => setCustomPortalLabel(e.target.value)}
                  placeholder="e.g. Berkheimer Local EIT Upload"
                  className="glass-input w-full rounded-xl px-3 py-2"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">File Format</label>
                <select
                  value={fileFormat}
                  onChange={(e) => setFileFormat(e.target.value as UploadFileFormat)}
                  className="glass-input w-full rounded-xl px-3 py-2 font-semibold"
                >
                  {selectedPortal.supportedFormats.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt === 'MMREF_1' ? 'PA Standard (MMREF-1)' : fmt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Business Location PSD Code</label>
                <input
                  type="text"
                  value={businessLocationPsd}
                  onChange={(e) => setBusinessLocationPsd(e.target.value)}
                  placeholder="e.g. 150302"
                  className="glass-input w-full rounded-xl px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                Portal Template File {isEnabled ? '*' : '(Optional when disabled)'}
              </label>
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-950/40 cursor-pointer transition">
                <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {templateFileName ? `Selected: ${templateFileName}` : 'Choose .csv or .txt template file from portal'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Download the template from {selectedPortal.portalLabel.split('—')[1]?.trim() || 'the tax portal'} and upload it here.
                </span>
                <input type="file" accept=".csv,.txt,.mmref" onChange={handleFilePick} className="hidden" />
              </label>
            </div>

            {parsedPreview && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Detected Columns / Records ({parsedPreview.detectedHeaders.length})
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    SHA-256: {parsedPreview.templateHashSha256.slice(0, 12)}…
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {parsedPreview.detectedHeaders.map((hdr, idx) => (
                    <span
                      key={`${hdr}-${idx}`}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]"
                    >
                      {hdr}
                    </span>
                  ))}
                </div>
                {parsedPreview.warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    ⚠ {w}
                  </p>
                ))}
              </div>
            )}

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Keystone Business Portal CSV template"
                className="glass-input w-full rounded-xl px-3 py-2"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              {existingRecord ? (
                confirmRemove ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                    >
                      Confirm Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRemove(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    className="px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 inline-flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={saving || loading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Upload Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
