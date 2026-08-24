import React, { useState } from 'react';
import { 
  Landmark, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Download,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  History,
  CheckCircle2,
  Clock,
  Lock
} from 'lucide-react';
import { ComplianceTask, Employee, Organization, PayrollRun, PayStub } from '../types';
import { ComplianceBoxMappingTable } from './ComplianceBoxMappingTable';
import { W2W3PreviewModal } from './W2W3PreviewModal';
import { TaxRemittanceSummaryCards } from './TaxRemittanceSummaryCards';
import { TaxPaymentInstructionsDrawer } from './TaxPaymentInstructionsDrawer';
import { calculateW2Summaries, calculateW3Summary } from '../utils/w2w3Data';
import { generateW2W3BundlePdf, downloadPdfDocument } from '../utils/w2w3PdfBuilder';
import { getRecordYear, getTaskTaxYear, createDefaultComplianceTasks, isFutureYear } from '../utils/taxEngine';

interface ComplianceFilingsViewProps {
  complianceTasks: ComplianceTask[];
  org: Organization;
  employees: Employee[];
  payrollRuns: PayrollRun[];
  payStubs: PayStub[];
  activeTaxYear?: number;
  onMarkTaskFiled: (taskId: string, confirmationNum: string, taskDetails?: Partial<ComplianceTask>) => void;
  onNavigateToAuditTrail?: () => void;
}

export function ComplianceFilingsView({
  complianceTasks,
  org,
  employees = [],
  payrollRuns,
  payStubs,
  activeTaxYear = 2026,
  onMarkTaskFiled,
  onNavigateToAuditTrail
}: ComplianceFilingsViewProps) {
  // Filter tasks & paystubs for activeTaxYear
  const yearTasks = complianceTasks.filter(t => getTaskTaxYear(t) === activeTaxYear);
  const tasksToDisplay = yearTasks.length > 0 ? yearTasks : createDefaultComplianceTasks(activeTaxYear);
  const yearPayStubs = (payStubs || []).filter(s => getRecordYear(s.payDate || s.periodStart) === activeTaxYear);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasksToDisplay[0]?.id || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showW2W3Modal, setShowW2W3Modal] = useState<boolean>(false);
  const [activeDrawerGuideKey, setActiveDrawerGuideKey] = useState<string | null>(null);

  const computedTasks = tasksToDisplay.map(task => {
    if (!yearPayStubs || yearPayStubs.length === 0) return task;

    const uniqueEmpsCount = new Set(yearPayStubs.map(s => s.employeeId)).size;
    const totalGross = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.grossEarnings || 0), 0) * 100) / 100;
    const totalFedTax = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.federalIncomeTax || 0), 0) * 100) / 100;
    const totalSSTax = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.socialSecurityTax || 0), 0) * 100) / 100;
    const totalMedTax = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.medicareTax || 0), 0) * 100) / 100;
    const totalPATax = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.paStateTax || 0), 0) * 100) / 100;
    const totalEITTax = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.paLocalEit || 0), 0) * 100) / 100;
    const totalLST = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.paLst || 0), 0) * 100) / 100;
    const totalEmployerSS = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.employerSocialSecurity || 0), 0) * 100) / 100;
    const totalEmployerMed = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.employerMedicare || 0), 0) * 100) / 100;
    const totalEmployerUC = Math.round(yearPayStubs.reduce((sum, s) => sum + (s.employerPaUc || 0), 0) * 100) / 100;

    const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (task.formIdentifier === 'FORM_941') {
      const total941 = totalFedTax + totalSSTax + totalEmployerSS + totalMedTax + totalEmployerMed;
      return {
        ...task,
        amountDue: total941,
        boxValues: {
          'box1_employees': { label: '1. Number of employees paid in period', value: String(uniqueEmpsCount) },
          'box2_wages': { label: '2. Wages, tips, and other compensation', value: fmt(totalGross) },
          'box3_fed_tax': { label: '3. Federal income tax withheld from wages', value: fmt(totalFedTax) },
          'box5a_ss_wages': { label: '5a. Taxable social security wages', value: fmt(totalGross), helper: `SS Tax: ${fmt(totalSSTax + totalEmployerSS)} (6.2% EE + 6.2% ER)` },
          'box5c_med_wages': { label: '5c. Taxable Medicare wages', value: fmt(totalGross), helper: `Medicare Tax: ${fmt(totalMedTax + totalEmployerMed)} (1.45% EE + 1.45% ER)` },
          'box10_total_taxes': { label: '10. Total taxes after adjustments', value: fmt(total941) }
        }
      };
    }

    if (task.formIdentifier === 'REV_1667' || task.formIdentifier === 'REV-1667' || task.jurisdiction === 'PA_MYPATH_SIT') {
      return {
        ...task,
        amountDue: totalPATax,
        boxValues: {
          'box1_gross': { label: 'Total PA Gross Compensation', value: fmt(totalGross), helper: 'Total compensation subject to PA state income tax' },
          'box2_tax_withheld': { label: 'PA Income Tax Withheld (3.07%)', value: fmt(totalPATax), helper: 'Statutory 3.07% PA state tax withheld' },
          'box3_remittance': { label: 'Total Remittance Amount', value: fmt(totalPATax), helper: 'Paid electronically via PA myPATH portal' }
        }
      };
    }

    if (task.formIdentifier === 'PA_UC_2') {
      return {
        ...task,
        amountDue: totalEmployerUC,
        boxValues: {
          'total_wages': { label: 'Gross PA UC Covered Wages', value: fmt(totalGross) },
          'employer_contribution': { label: 'Employer UC Contribution (3.822%)', value: fmt(totalEmployerUC) },
          'employee_withholding': { label: 'Employee UC Tax Withholding (0.07%)', value: fmt(totalGross * 0.0007) }
        }
      };
    }

    if (task.formIdentifier === 'PA_LOCAL_EIT') {
      const totalLocal = totalEITTax + totalLST;
      return {
        ...task,
        amountDue: totalLocal,
        boxValues: {
          'local_wages': { label: 'Gross Local Taxable Compensation', value: fmt(totalGross) },
          'local_eit_tax': { label: 'Local Earned Income Tax (EIT) Withheld', value: fmt(totalEITTax) },
          'local_lst_tax': { label: 'Local Services Tax (LST) Withheld', value: fmt(totalLST) },
          'total_local_remittance': { label: 'Total Remittance to Local Collector', value: fmt(totalLocal) }
        }
      };
    }

    if (task.formIdentifier === 'W2_W3') {
      return {
        ...task,
        amountDue: 0.00,
        boxValues: {
          'box1_wages': { label: 'Box 1: Wages, tips, other compensation', value: fmt(totalGross) },
          'box2_fed_withheld': { label: 'Box 2: Federal income tax withheld', value: fmt(totalFedTax) },
          'box3_ss_wages': { label: 'Box 3: Social security wages', value: fmt(totalGross) },
          'box4_ss_tax': { label: 'Box 4: Social security tax withheld', value: fmt(totalSSTax) },
          'box5_med_wages': { label: 'Box 5: Medicare wages and tips', value: fmt(totalGross) },
          'box6_med_tax': { label: 'Box 6: Medicare tax withheld', value: fmt(totalMedTax) },
          'box16_pa_wages': { label: 'Box 16: State wages (PA)', value: fmt(totalGross) },
          'box17_pa_tax': { label: 'Box 17: State income tax (PA 3.07%)', value: fmt(totalPATax) },
          'box18_local_wages': { label: 'Box 18: Local wages, tips, etc.', value: fmt(totalGross) },
          'box19_local_tax': { label: 'Box 19: Local income tax (EIT)', value: fmt(totalEITTax) }
        }
      };
    }

    return task;
  });

  const selectedTask = computedTasks.find(t => t.id === selectedTaskId) || computedTasks[0];

  const handleCopy = (text: string | number, key: string) => {
    const cleanText = String(text).replace(/[$,]/g, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenGuideByKey = (guideKey: string) => {
    setActiveDrawerGuideKey(guideKey);
  };

  const handleDownloadCSV = (task: ComplianceTask) => {
    let csv = `Filing Entity,EIN,State Tax ID,Form,Tax Period\n`;
    csv += `"${org.name}","${org.ein}","${org.stateTaxId}","${task.title}","${task.taxPeriodLabel}"\n\nBox Key,Box Label,Value\n`;
    Object.entries(task.boxValues).forEach(([key, box]) => {
      csv += `"${key}","${box.label}","${String(box.value).replace(/"/g, '""')}"\n`;
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `${task.formIdentifier}_${org.name.replace(/\s+/g, '_')}_Filing_Summary.csv`;
    link.click();
  };

  const handleDownloadTextSummary = (task: ComplianceTask) => {
    let text = `=====================================================\n   ${task.title.toUpperCase()}\n=====================================================\n`;
    text += `Filing Entity : ${org.name}\nEmployer EIN  : ${org.ein}\nTax Period    : ${task.taxPeriodLabel}\nDue Date      : ${task.dueDate}\n-----------------------------------------------------\n\n`;
    Object.values(task.boxValues).forEach(box => { text += `${box.label.padEnd(46, ' ')} : ${box.value}\n`; });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8;' }));
    link.download = `${task.formIdentifier}_${org.name.replace(/\s+/g, '_')}_Transmittal_Summary.txt`;
    link.click();
  };

  const handleQuickDownloadBundle = () => {
    const w2s = calculateW2Summaries(org, employees, payStubs);
    const w3 = calculateW3Summary(org, w2s);
    const bundleDoc = generateW2W3BundlePdf(org, w2s, w3);
    downloadPdfDocument(bundleDoc, `Official_W2_W3_Bundle_${org.name.replace(/\s+/g, '_')}_2026.pdf`);
  };

  const isFutureActiveYear = isFutureYear(activeTaxYear);

  return (
    <div className="space-y-6">
      {/* Future Tax Year Warning Banner */}
      {isFutureActiveYear && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-medium flex items-center gap-3 shadow-sm">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold block text-sm">Future Tax Year Locked ({activeTaxYear})</span>
            <span>Filing tax returns and remitting payments for future tax years is locked until tax year {activeTaxYear} begins.</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Agency Tax Remittance & Compliance Hub</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time tax liability tracking, step-by-step agency deposit guides, and automated box mapping.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => !isFutureActiveYear && setShowW2W3Modal(true)}
            disabled={isFutureActiveYear}
            title={isFutureActiveYear ? `Generating W-2/W-3 forms for future tax year (${activeTaxYear}) is locked` : 'Generate W-2 / W-3 PDFs'}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              isFutureActiveYear
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 cursor-pointer'
            }`}
          >
            {isFutureActiveYear ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Generate W-2 / W-3 PDFs</span>
          </button>
          <a href="https://mypath.pa.gov" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 flex items-center gap-1">
            <span>PA myPATH</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://www.eftps.gov" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <span>IRS EFTPS</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Live Tax Liabilities Breakdown Cards */}
      <TaxRemittanceSummaryCards
        payStubs={yearPayStubs}
        onOpenGuide={handleOpenGuideByKey}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Deadlines */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Scheduled Agency Filings</h3>
          <div className="space-y-2.5">
            {computedTasks.map((task) => {
              const isTaskFuture = isFutureYear(getTaskTaxYear(task));
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    task.id === selectedTaskId
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 shadow-md'
                      : 'bg-white/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{task.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${
                      isTaskFuture
                        ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700'
                        : task.status === 'FILED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                      {isTaskFuture ? 'LOCKED (FUTURE YEAR)' : task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Due: {task.dueDate}</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      ${(task.amountDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Transmittal Assistant & Box Mapping */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTask && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedTask.title}</h3>
                    <button
                      onClick={() => {
                        let gKey = 'FEDERAL_941';
                        if (selectedTask.formIdentifier === 'REV_1667') gKey = 'PA_SIT_REV1667';
                        if (selectedTask.formIdentifier === 'PA_UC_2') gKey = 'PA_UC2';
                        if (selectedTask.formIdentifier === 'W2_W3') gKey = 'W2_W3_BUNDLE';
                        if (selectedTask.formIdentifier === 'PA_LOCAL_EIT') gKey = 'PA_LOCAL_EIT';
                        handleOpenGuideByKey(gKey);
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:underline border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Payment Guide</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Filing Entity: {org.name} • EIN: {org.ein}</p>
                </div>

                {selectedTask.formIdentifier === 'W2_W3' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowW2W3Modal(true)}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Preview W-2 / W-3 Forms</span>
                    </button>
                    <button
                      onClick={handleQuickDownloadBundle}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF Package</span>
                    </button>
                  </div>
                )}
              </div>

              {selectedTask.status === 'FILED' && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">Filing Completed & Remittance Recorded</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                      FILED
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100">
                    <div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">Confirmation Ref / ACH ID</span>
                      <span className="font-mono font-bold text-xs">{selectedTask.confirmationNumber || 'Logged'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">Date Filed</span>
                      <span className="font-semibold text-xs">{selectedTask.filedDate || new Date().toISOString().split('T')[0]}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">Amount Paid</span>
                      <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300">
                        ${(selectedTask.amountDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <ComplianceBoxMappingTable
                task={selectedTask}
                copiedKey={copiedKey}
                onCopy={handleCopy}
                onDownloadCSV={handleDownloadCSV}
                onDownloadTextSummary={handleDownloadTextSummary}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tax Remittance & ACH Payment History */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tax Remittance & ACH Payment History</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified record of all state withholding, federal tax deposits, and local remittances logged with audit trail tracking.
            </p>
          </div>

          {onNavigateToAuditTrail && (
            <button
              onClick={onNavigateToAuditTrail}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Audit Log</span>
            </button>
          )}
        </div>

        {(() => {
          const filedTasks = computedTasks.filter(t => t.status === 'FILED' || Boolean(t.confirmationNumber));
          if (filedTasks.length === 0) {
            return (
              <div className="p-8 text-center rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Filed Tax Remittances Recorded Yet</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  When you disburse a tax payment via Mercury ACH or enter a myPATH/EFTPS confirmation number, your payment will automatically be recorded here and written to the audit log.
                </p>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/60 uppercase font-semibold text-[10px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Tax Form / Return</th>
                    <th className="px-4 py-3">Tax Period</th>
                    <th className="px-4 py-3">Date Paid / Filed</th>
                    <th className="px-4 py-3">Confirmation Ref / ACH Trace ID</th>
                    <th className="px-4 py-3 text-right">Amount Remitted</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {filedTasks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-sans font-semibold text-slate-900 dark:text-white">
                        {t.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-sans">
                        {t.taxPeriodLabel}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-sans">
                        {t.filedDate || new Date().toISOString().split('T')[0]}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-[11px] border border-slate-200 dark:border-slate-700">
                          {t.confirmationNumber || 'CONF-LOGGED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ${(t.amountDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-sans">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          FILED & PAID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Slide-over Drawer for Instructions */}
      {activeDrawerGuideKey && (
        <TaxPaymentInstructionsDrawer
          guideKey={activeDrawerGuideKey}
          task={(() => {
            const matched = computedTasks.find(t => {
              if (activeDrawerGuideKey === 'FEDERAL_941') return t.formIdentifier === 'FORM_941' || t.jurisdiction === 'FEDERAL_IRS';
              if (activeDrawerGuideKey === 'PA_SIT_REV1667') return t.formIdentifier === 'REV_1667' || t.formIdentifier === 'REV-1667' || t.jurisdiction === 'PA_MYPATH_SIT' || Boolean(t.jurisdiction?.includes('SIT'));
              if (activeDrawerGuideKey === 'PA_UC2') return t.formIdentifier === 'PA_UC_2' || t.jurisdiction === 'PA_MYPATH_UC' || Boolean(t.jurisdiction?.includes('UC'));
              if (activeDrawerGuideKey === 'W2_W3_BUNDLE') return t.formIdentifier === 'W2_W3' || t.jurisdiction === 'SSA_W2';
              if (activeDrawerGuideKey === 'PA_LOCAL_EIT') return t.formIdentifier === 'PA_LOCAL_EIT' || t.jurisdiction === 'LOCAL_EIT' || Boolean(t.jurisdiction?.includes('LOCAL'));
              return false;
            });
            if (matched && matched.amountDue > 0) return matched;

            // Construct dynamic fallback task with live calculated amount from payStubs
            const totalPATax = (payStubs || []).reduce((sum, s) => sum + (s.paStateTax || 0), 0);
            const totalFIT = (payStubs || []).reduce((sum, s) => sum + (s.federalIncomeTax || 0), 0);
            const totalEESS = (payStubs || []).reduce((sum, s) => sum + (s.socialSecurityTax || 0), 0);
            const totalERSS = (payStubs || []).reduce((sum, s) => sum + (s.employerSocialSecurity || 0), 0);
            const totalEEMed = (payStubs || []).reduce((sum, s) => sum + (s.medicareTax || 0), 0);
            const totalERMed = (payStubs || []).reduce((sum, s) => sum + (s.employerMedicare || 0), 0);
            const totalFed = totalFIT + totalEESS + totalERSS + totalEEMed + totalERMed;
            const totalUC = (payStubs || []).reduce((sum, s) => sum + (s.employerPaUc || 0), 0);
            const totalLocal = (payStubs || []).reduce((sum, s) => sum + (s.paLocalEit || 0) + (s.paLst || 0), 0);

            if (activeDrawerGuideKey === 'PA_SIT_REV1667') {
              return {
                id: matched?.id || 'dyn_rev_1667',
                jurisdiction: 'PA_MYPATH_SIT',
                formIdentifier: 'REV_1667',
                title: 'PA myPATH Form REV-1667 (State Withholding Return)',
                taxPeriodLabel: '2026 Monthly / Quarterly',
                dueDate: matched?.dueDate || 'Upcoming',
                status: matched?.status || 'READY_TO_FILE',
                amountDue: totalPATax,
                boxValues: matched?.boxValues || {}
              };
            }
            if (activeDrawerGuideKey === 'FEDERAL_941') {
              return {
                id: matched?.id || 'dyn_form_941',
                jurisdiction: 'FEDERAL_IRS',
                formIdentifier: 'FORM_941',
                title: 'IRS Form 941 (Employer Quarterly Federal Tax Return)',
                taxPeriodLabel: '2026 Q3',
                dueDate: matched?.dueDate || 'Upcoming',
                status: matched?.status || 'READY_TO_FILE',
                amountDue: totalFed,
                boxValues: matched?.boxValues || {}
              };
            }
            if (activeDrawerGuideKey === 'PA_UC2') {
              return {
                id: matched?.id || 'dyn_pa_uc2',
                jurisdiction: 'PA_MYPATH_UC',
                formIdentifier: 'PA_UC_2',
                title: 'PA Unemployment Compensation Return (Form UC-2)',
                taxPeriodLabel: '2026 Q3',
                dueDate: matched?.dueDate || 'Upcoming',
                status: matched?.status || 'READY_TO_FILE',
                amountDue: totalUC,
                boxValues: matched?.boxValues || {}
              };
            }
            if (activeDrawerGuideKey === 'PA_LOCAL_EIT') {
              return {
                id: matched?.id || 'dyn_pa_local',
                jurisdiction: 'LOCAL_EIT',
                formIdentifier: 'PA_LOCAL_EIT',
                title: 'PA Local EIT & LST Quarterly Return',
                taxPeriodLabel: '2026 Q3',
                dueDate: matched?.dueDate || 'Upcoming',
                status: matched?.status || 'READY_TO_FILE',
                amountDue: totalLocal,
                boxValues: matched?.boxValues || {}
              };
            }

            return matched || selectedTask || null;
          })()}
          org={org || null}
          onClose={() => setActiveDrawerGuideKey(null)}
          onMarkTaskFiled={onMarkTaskFiled}
        />
      )}

      {/* W-2 / W-3 Preview Modal */}
      {showW2W3Modal && (
        <W2W3PreviewModal
          org={org}
          employees={employees}
          payStubs={payStubs}
          onClose={() => setShowW2W3Modal(false)}
        />
      )}
    </div>
  );
}
