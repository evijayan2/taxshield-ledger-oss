import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Download,
  FileCode,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Zap,
} from 'lucide-react';
import type { IRemotePackageCatalogItem, ISchedulerStatus } from '../../server/services/taxPackageClient.js';

export interface PackageSyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPackageIngested?: (result: any) => void;
}

export const PackageSyncDrawer: React.FC<PackageSyncDrawerProps> = ({
  isOpen,
  onClose,
  onPackageIngested,
}) => {
  const [serverUrl, setServerUrl] = useState((import.meta as any).env?.VITE_TAXPACK_SERVER_URL || 'https://tax-rule-packaging-engine.vercel.app');
  const [packages, setPackages] = useState<IRemotePackageCatalogItem[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<ISchedulerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<IRemotePackageCatalogItem | null>(null);
  const [activateImmediately, setActivateImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/tax-packages/status');
      const data = await res.json();
      if (data.success) {
        setSchedulerStatus(data.status);
      }
    } catch {
      // ignore status error
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/tax-packages/remote?serverUrl=${encodeURIComponent(serverUrl)}`);
      const data = await res.json();
      if (data.success) {
        setPackages(data.packages || []);
        setConnected(true);
      } else {
        setPackages([]);
        setConnected(false);
        setError(data.error || 'Failed to connect to package distribution server');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConnected(false);
      setError(`Network error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    if (isOpen) {
      void fetchCatalog();
      void fetchStatus();
    }
  }, [isOpen, fetchCatalog, fetchStatus]);

  const handleIngest = async () => {
    if (!selectedPkg) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/tax-packages/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl,
          fileName: selectedPkg.fileName,
          activateImmediately,
          confirmWrite: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          `Ingested ${data.rulesIngested} rules and ${data.versionsCreated} versions for ${data.packageCode}!`
        );
        setSelectedPkg(null);
        void fetchStatus();
        if (onPackageIngested) onPackageIngested(data);
      } else {
        setError(data.error || 'Ingestion failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to ingest package: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/tax-packages/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl,
          activateImmediately,
          confirmWrite: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          `Successfully synchronized ${data.ingestedPackages}/${data.totalPackages} packages (${data.totalRules} rules, ${data.totalVersions} versions)!`
        );
        void fetchStatus();
        if (onPackageIngested) onPackageIngested(data);
      } else {
        setError(data.error || 'Batch package sync failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Batch sync error: ${msg}`);
    } finally {
      setSyncingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                MODULE 1 TO 2 BRIDGE
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Tax Package Distribution Server</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fetch, cryptographically verify, and ingest sealed tax rule bundles (.taxpack.json)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daily Scheduler Status Banner */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-emerald-900 dark:text-emerald-300">Daily Background Sync:</span>
            <span className="text-emerald-700 dark:text-emerald-400">Active (Runs once every 24h)</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Last Checked: {schedulerStatus?.lastCheckedAt ? new Date(schedulerStatus.lastCheckedAt).toLocaleTimeString() : 'Pending'}
          </span>
        </div>

        {/* Server Connection Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Server className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://tax-rule-packaging-engine.vercel.app"
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={fetchCatalog}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Connect</span>
            </button>
            <button
              onClick={handleSyncAll}
              disabled={syncingAll || packages.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-sm"
            >
              <Zap className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
              <span>{syncingAll ? 'Syncing...' : 'Sync All Packages'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : connected === false ? 'bg-rose-500' : 'bg-slate-400'}`} />
              <span className="text-slate-600 dark:text-slate-300">
                {connected ? 'Connected to Packaging Server' : connected === false ? 'Offline / Unreachable' : 'Not Connected'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">{packages.length} package(s) available</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Notice</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Selected Package Confirmation Card */}
          {selectedPkg && (
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Confirm Ingestion: {selectedPkg.packageCode}
                  </span>
                </div>
                <button onClick={() => setSelectedPkg(null)} className="text-xs text-slate-400 hover:text-slate-600">
                  Cancel
                </button>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-mono break-all text-slate-700 dark:text-slate-300">
                <span className="text-slate-400">Checksum: </span>{selectedPkg.manifestChecksum}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activateImmediately"
                  checked={activateImmediately}
                  onChange={(e) => setActivateImmediately(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="activateImmediately" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Activate immediately in ledger (supersedes prior active versions)
                </label>
              </div>

              <button
                onClick={handleIngest}
                disabled={submitting}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{submitting ? 'Verifying & Ingesting...' : 'Confirm Database Write & Ingest'}</span>
              </button>
            </div>
          )}

          {/* Package Catalog List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sealed Packages Ready for Ingestion
            </h3>

            {packages.length === 0 && !loading && (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No packages loaded. Ensure server is running on {serverUrl} and click Connect.
                </p>
              </div>
            )}

            {packages.map((pkg) => (
              <div
                key={pkg.packageCode}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{pkg.packageCode}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        v{pkg.version}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {pkg.jurisdictionCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{pkg.name}</p>
                  </div>

                  <button
                    onClick={() => setSelectedPkg(pkg)}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ingest</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 font-mono">
                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                    <span>{pkg.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span>{pkg.ruleCount} rule(s)</span>
                    <span>•</span>
                    <span>{(pkg.sizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>SHA-256 Tamper Protection Active</span>
          </span>
          <button onClick={onClose} className="text-xs text-slate-600 dark:text-slate-300 hover:underline cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
