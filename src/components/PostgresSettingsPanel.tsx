import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowUpRight, 
  Server, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { getPostgresStatus, initPostgresDatabase, PostgresStatus } from '../utils/api';
import { AllAppData } from '../utils/storage';

interface PostgresSettingsPanelProps {
  currentData: AllAppData;
  onSyncToPostgres: () => Promise<void>;
  onPullFromPostgres: () => Promise<void>;
}

export function PostgresSettingsPanel({
  currentData,
  onSyncToPostgres,
  onPullFromPostgres
}: PostgresSettingsPanelProps) {
  const [status, setStatus] = useState<PostgresStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getPostgresStatus();
      setStatus(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to check database status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleMigrate = async () => {
    setSyncing(true);
    setErrorMsg(null);
    try {
      const res = await initPostgresDatabase();
      if (res.success) {
        setSyncSuccess('PostgreSQL tables initialized and verified.');
        await checkStatus();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncSuccess(null), 3000);
    }
  };

  const handlePush = async () => {
    setSyncing(true);
    setErrorMsg(null);
    try {
      await onSyncToPostgres();
      setSyncSuccess('Ledger data successfully synced to Vercel Postgres!');
      await checkStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncSuccess(null), 3500);
    }
  };

  const handlePull = async () => {
    setSyncing(true);
    setErrorMsg(null);
    try {
      await onPullFromPostgres();
      setSyncSuccess('Ledger refreshed from Vercel Postgres cloud database!');
      await checkStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Pull failed');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncSuccess(null), 3500);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Vercel Postgres (PostgreSQL) Database
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Relational database persistence for multi-device synchronization & cloud durability
            </p>
          </div>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
          title="Refresh database connection status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
        </button>
      </div>

      {/* Status Banner */}
      {status?.connected ? (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                Connected to {status.provider || 'Vercel Postgres'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                SSL Active
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
              Host: {status.host} • DB: {status.database}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-800 dark:text-amber-300">
              {status?.configured ? 'PostgreSQL Connection Notice' : 'PostgreSQL Database Ready (Local Fallback Active)'}
            </span>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              {status?.message || 'App is currently running in zero-latency persistent browser mode. Connect Vercel Postgres by providing POSTGRES_URL.'}
            </p>
          </div>
        </div>
      )}

      {/* Table Statistics if Connected */}
      {status?.tableCounts && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>PostgreSQL Relational Schema & Tables:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Staff / Employees</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{status.tableCounts.employees ?? 0}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Mileage Logs</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{status.tableCounts.mileage_logs ?? 0}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Payroll Stubs</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{status.tableCounts.pay_stubs ?? 0}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 block">Compliance Tasks</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{status.tableCounts.compliance_tasks ?? 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={handlePush}
          disabled={syncing}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Server className="w-3.5 h-3.5" />
          <span>{syncing ? 'Syncing...' : 'Sync Local Data to Postgres'}</span>
        </button>

        {status?.connected && (
          <button
            onClick={handlePull}
            disabled={syncing}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Pull from Postgres</span>
          </button>
        )}

        <button
          onClick={handleMigrate}
          disabled={syncing}
          className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Verify / Create Tables</span>
        </button>
      </div>

      {/* Success / Error Feedback */}
      {syncSuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 text-xs flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Vercel Postgres Environment Variable Instructions */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 font-mono text-[11px]">
        <div className="text-slate-500 dark:text-slate-400 font-sans font-bold flex items-center gap-1 text-[11px]">
          <span>How to attach Vercel Postgres in production:</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          1. In your <strong>Vercel Dashboard</strong>, go to <strong>Storage</strong> &gt; <strong>Create Database</strong> &gt; <strong>Postgres (Neon)</strong>.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          2. Connect the database to your project. Vercel automatically exposes:
        </p>
        <p className="text-blue-600 dark:text-blue-400 font-bold">
          POSTGRES_URL="postgres://default:***@ep-***-pooler.us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require"
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-[10px]">
          The backend automatically runs schema migrations and persists all 8 tables seamlessly.
        </p>
      </div>

    </div>
  );
}
