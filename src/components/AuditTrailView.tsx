import React, { useState } from 'react';
import { ShieldCheck, History, Search, FileText, User, ChevronRight, Eye } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditTrailViewProps {
  logs: AuditLogEntry[];
}

/**
 * Audit Trail Inspector component for compliance tracking and change history.
 */
export function AuditTrailView({ logs }: AuditTrailViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return log.entityType.toLowerCase().includes(term) ||
           log.entityId.toLowerCase().includes(term) ||
           log.action.toLowerCase().includes(term) ||
           (log.reason && log.reason.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Audit Trail & Calculation Logs
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Immutable log of all financial modifications, rule activations, and payroll snapshots.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Audit Trail Active
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search entity, action, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 glass-input rounded-lg text-sm"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{filteredLogs.length} total entries</span>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity Type</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Reason / Details</th>
                <th className="px-6 py-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-sans">
                    No audit records logged yet. Write operations automatically generate entries.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.action === 'CREATE' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' :
                        log.action === 'UPDATE' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40' :
                        log.action === 'DELETE' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40' :
                        'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {log.entityType}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.actorId}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-sans">
                      {log.reason || 'Ledger modification'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-sans cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Diff View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON State Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setSelectedLog(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
            <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Audit Record Inspector
                </h3>
                <button onClick={() => setSelectedLog(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm cursor-pointer">Close</button>
              </div>

              <div className="space-y-3 font-mono text-xs flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 bg-slate-100 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Record ID:</span>
                    <span className="text-slate-800 dark:text-slate-300">{selectedLog.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Timestamp:</span>
                    <span className="text-slate-800 dark:text-slate-300">{new Date(selectedLog.timestamp).toISOString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold font-sans text-xs">Previous State (Before)</span>
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-700 max-h-80 overflow-y-auto">
                      {selectedLog.previousState ? JSON.stringify(selectedLog.previousState, null, 2) : 'null (New Creation)'}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-sans text-xs">New State (After)</span>
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-700 max-h-80 overflow-y-auto">
                      {selectedLog.newState ? JSON.stringify(selectedLog.newState, null, 2) : 'null (Deleted Record)'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
