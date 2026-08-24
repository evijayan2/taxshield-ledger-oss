import React from 'react';
import { Download, FileText, Check, Copy } from 'lucide-react';
import { ComplianceTask } from '../types';

interface ComplianceBoxMappingTableProps {
  task: ComplianceTask;
  copiedKey: string | null;
  onCopy: (text: string | number, key: string) => void;
  onDownloadCSV: (task: ComplianceTask) => void;
  onDownloadTextSummary: (task: ComplianceTask) => void;
}

export function ComplianceBoxMappingTable({
  task,
  copiedKey,
  onCopy,
  onDownloadCSV,
  onDownloadTextSummary
}: ComplianceBoxMappingTableProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
          Pre-Aggregated Box Values (Ready to Copy-Paste)
        </h4>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDownloadCSV(task)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer"
            title="Download box values as CSV file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={() => onDownloadTextSummary(task)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Download form transmittal summary text file"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download Summary (.txt)</span>
          </button>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/40 divide-y divide-slate-100 dark:divide-slate-800/80">
        {Object.entries(task.boxValues).map(([key, box]) => (
          <div key={key} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{box.label}</span>
              {box.helper && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{box.helper}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                {box.value}
              </span>
              <button
                onClick={() => onCopy(box.value, key)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                title="Copy raw numeric value without symbols"
              >
                {copiedKey === key ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
