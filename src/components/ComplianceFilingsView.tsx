import React, { useState } from 'react';
import { 
  Landmark, 
  Copy, 
  Check, 
  ExternalLink, 
  Calendar, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ComplianceTask, Organization, PayrollRun, PayStub } from '../types';

interface ComplianceFilingsViewProps {
  complianceTasks: ComplianceTask[];
  org: Organization;
  payrollRuns: PayrollRun[];
  payStubs: PayStub[];
  onMarkTaskFiled: (taskId: string, confirmationNum: string) => void;
}

export function ComplianceFilingsView({
  complianceTasks,
  org,
  payrollRuns,
  payStubs,
  onMarkTaskFiled
}: ComplianceFilingsViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(complianceTasks[0]?.id || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confNumInput, setConfNumInput] = useState<string>('');

  const selectedTask = complianceTasks.find(t => t.id === selectedTaskId) || complianceTasks[0];

  const handleCopy = (text: string | number, key: string) => {
    const cleanText = String(text).replace(/[$,]/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileSubmit = (taskId: string) => {
    const ref = confNumInput || `CONF-${Math.floor(Math.random() * 899999 + 100000)}`;
    onMarkTaskFiled(taskId, ref);
    setConfNumInput('');
    confetti({ particleCount: 60, spread: 70 });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Agency Compliance Filing Assistant</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Side-by-side box mapping for PA myPATH, IRS Form 941, and Year-End SSA W-2/W-3 portals. Copy numbers directly into state/federal web forms with 0 manual math.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://mypath.pa.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Open PA myPATH</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://www.eftps.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Open IRS EFTPS</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Grid: Task Selector & Assistant Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Filing Tasks List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Scheduled Tax Deadlines</h3>
          <div className="space-y-2.5">
            {complianceTasks.map((task) => {
              const isSelected = task.id === selectedTaskId;
              const isFiled = task.status === 'FILED';

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md'
                      : 'bg-white/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{task.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 border ${
                      isFiled
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                    }`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Due: {task.dueDate}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">${task.amountDue.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Side-by-Side Box Values Assistant */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTask ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              
              {/* Task Header Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedTask.title}</h3>
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                      {selectedTask.taxPeriodLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Filing Entity: <strong className="text-slate-800 dark:text-slate-200">{org.name}</strong> • EIN: <strong className="text-slate-800 dark:text-slate-200">{org.ein}</strong> • PA ID: <strong className="text-slate-800 dark:text-slate-200">{org.stateTaxId}</strong>
                  </p>
                </div>

                {selectedTask.status === 'FILED' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Filed Ref: {selectedTask.confirmationNumber}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Portal Conf #"
                      value={confNumInput}
                      onChange={(e) => setConfNumInput(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white w-32 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleFileSubmit(selectedTask.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-md shadow-emerald-700/20"
                    >
                      Record Filing
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions Tip */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>How to use:</strong> Open your state or federal portal in a side window. Click the copy icon next to each pre-calculated field below to instantly paste exact figures with zero calculation or rounding errors.
                </p>
              </div>

              {/* Box Mapping Table */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                  Pre-Aggregated Box Values (Ready to Copy-Paste)
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/40 divide-y divide-slate-100 dark:divide-slate-800/80">
                  {Object.entries(selectedTask.boxValues).map(([key, box]) => (
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
                          onClick={() => handleCopy(box.value, key)}
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

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
              Select a scheduled tax deadline from the left to view box mapping.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
