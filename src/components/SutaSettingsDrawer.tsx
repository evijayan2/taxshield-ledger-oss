import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ShieldCheck, AlertCircle, CheckCircle2, History, Building2, Save, FileText } from 'lucide-react';
import { getStatutorySutaRule, validateSutaRateBounds, formatRatePercent } from 'taxshield-ledger-core';

export interface SutaSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyState?: string;
  onSaved?: () => void;
}

const SUPPORTED_STATES = ['PA', 'NJ', 'DE', 'NY', 'OH', 'FL', 'TX'];

export const SutaSettingsDrawer: React.FC<SutaSettingsDrawerProps> = ({
  isOpen,
  onClose,
  companyId,
  companyState = 'PA',
  onSaved,
}) => {
  const [selectedState, setSelectedState] = useState(companyState);
  const [stateAccountId, setStateAccountId] = useState('');
  const [ratePercentInput, setRatePercentInput] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-01-01');
  const [noticeReference, setNoticeReference] = useState('');
  const [wageBaseOverride, setWageBaseOverride] = useState('');
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeStatutory = useMemo(() => {
    try {
      return getStatutorySutaRule(selectedState, new Date(effectiveFrom || '2026-01-01'));
    } catch {
      return null;
    }
  }, [selectedState, effectiveFrom]);

  const activeSetting = useMemo(() => {
    return settings.find((s) => s.jurisdiction.toUpperCase() === selectedState.toUpperCase());
  }, [settings, selectedState]);

  const loadSettings = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/suta-rates`);
      const data = await res.json();
      if (data.success && Array.isArray(data.settings)) {
        setSettings(data.settings);
        const current = data.settings.find((s: any) => s.jurisdiction.toUpperCase() === selectedState.toUpperCase());
        if (current) {
          setStateAccountId(current.stateAccountId || '');
          const activeRate = current.rateHistories?.find((h: any) => h.status === 'ACTIVE');
          if (activeRate) {
            setRatePercentInput(String(Number(activeRate.rateDecimal) * 100));
            setNoticeReference(activeRate.noticeReference || '');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load SUTA settings');
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedState]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      void loadSettings();
    }
  }, [isOpen, loadSettings]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setError(null);
    setSuccessMsg(null);
    const matched = settings.find((s) => s.jurisdiction.toUpperCase() === state.toUpperCase());
    if (matched) {
      setStateAccountId(matched.stateAccountId || '');
      const activeRate = matched.rateHistories?.find((h: any) => h.status === 'ACTIVE');
      setRatePercentInput(activeRate ? String(Number(activeRate.rateDecimal) * 100) : '');
      setNoticeReference(activeRate?.noticeReference || '');
    } else {
      setStateAccountId('');
      setRatePercentInput('');
      setNoticeReference('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    const parsedPercent = parseFloat(ratePercentInput);
    if (isNaN(parsedPercent)) {
      setError('Please provide a valid experience rate percentage.');
      return;
    }

    const rateDecimal = parsedPercent / 100;
    if (activeStatutory) {
      const check = validateSutaRateBounds(rateDecimal, activeStatutory);
      if (!check.valid) {
        setError(check.error || 'Rate is outside statutory bounds.');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/suta-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdiction: selectedState,
          stateAccountId: stateAccountId.trim() || undefined,
          rateDecimal,
          effectiveFrom,
          noticeReference: noticeReference.trim() || undefined,
          wageBaseOverride: wageBaseOverride ? parseFloat(wageBaseOverride) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`SUTA rate for ${selectedState} successfully updated to ${formatRatePercent(rateDecimal)}!`);
        void loadSettings();
        if (onSaved) onSaved();
      } else {
        setError(data.error || 'Failed to update SUTA rate.');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating SUTA rate.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden slide-in-from-right duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                EMPLOYER TAX SETTINGS
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">SUTA Experience Ratings</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage state unemployment contribution rates, DOL notices, and accounts.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            {SUPPORTED_STATES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleStateChange(st)}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                  selectedState === st
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {activeStatutory && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Statutory Rule Baseline ({activeStatutory.jurisdictionCode})
                </span>
                <span className="font-mono text-[11px] text-slate-500">{activeStatutory.ruleCode}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-slate-600 dark:text-slate-400">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Default Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{formatRatePercent(activeStatutory.rate)}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Wage Cap</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">${activeStatutory.wageCap.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Max Ceiling</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{activeStatutory.ceilingRate ? formatRatePercent(activeStatutory.ceilingRate) : 'None'}</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> State Employer Account ID
                </label>
                <input
                  type="text"
                  value={stateAccountId}
                  onChange={(e) => setStateAccountId(e.target.value)}
                  placeholder={`e.g. ${selectedState}-UC-1234567`}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Assigned Experience Rate (%) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={ratePercentInput}
                    onChange={(e) => setRatePercentInput(e.target.value)}
                    placeholder="e.g. 4.125"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Effective Date *</label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> DOL / DOR Notice Reference
                </label>
                <input
                  type="text"
                  value={noticeReference}
                  onChange={(e) => setNoticeReference(e.target.value)}
                  placeholder="e.g. PA Form UC-657 (2026 Contribution Rate Notice)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Validating & Saving...' : 'Save & Verify SUTA Rate'}</span>
            </button>
          </form>

          {activeSetting?.rateHistories && activeSetting.rateHistories.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-400" /> Rate History ({selectedState})
              </h3>
              <div className="space-y-1.5">
                {activeSetting.rateHistories.map((h: any) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {formatRatePercent(Number(h.rateDecimal))}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            h.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {h.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {h.noticeReference || 'No notice reference provided'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(h.effectiveFrom).toISOString().slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
