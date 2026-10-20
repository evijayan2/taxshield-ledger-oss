import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, CheckCircle2, Shield, Calendar, ArrowRight } from 'lucide-react';
import { AllAppData } from '../types';
import { 
  generateScheduleCExpensesCsv, 
  generateMileageLogCsv, 
  generatePayrollSummaryCsv, 
  downloadFile 
} from '../server/services/exportService';
import { getRecordYear } from '../utils/taxEngine';

interface YearEndExportViewProps {
  data: AllAppData;
}

/**
 * Year-End Accountant Export Package generator component.
 */
export function YearEndExportView({ data }: YearEndExportViewProps) {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const activeYear = data.activeTaxYear || 2026;
  const yearExpenses = data.generalExpenses.filter(e => getRecordYear(e.expenseDate) === activeYear);
  const yearMileage = data.mileageLogs.filter(m => getRecordYear(m.tripDate) === activeYear);
  const yearPayStubs = (data.payStubs || []).filter(s => getRecordYear(s.payDate || s.periodStart) === activeYear);

  const handleExportScheduleC = () => {
    const csv = generateScheduleCExpensesCsv(yearExpenses);
    downloadFile(csv, `Schedule_C_Expenses_${activeYear}.csv`, 'text/csv');
    setDownloadSuccess(`Schedule C Expenses CSV for ${activeYear} exported successfully!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExportMileage = () => {
    const csv = generateMileageLogCsv(yearMileage);
    downloadFile(csv, `IRS_Mileage_Logs_${activeYear}.csv`, 'text/csv');
    setDownloadSuccess(`IRS Mileage Log CSV for ${activeYear} exported successfully!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExportPayroll = () => {
    const csv = generatePayrollSummaryCsv(yearPayStubs);
    downloadFile(csv, `Payroll_Summary_${activeYear}.csv`, 'text/csv');
    setDownloadSuccess(`Payroll Summary CSV for ${activeYear} exported successfully!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExportFullPackage = () => {
    handleExportScheduleC();
    setTimeout(handleExportMileage, 500);
    setTimeout(handleExportPayroll, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> CPA Financial Package & Tax Prep
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Year-End Accountant Export Package ({activeYear})
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Export structured financial data packages (CSV & Excel format) formatted specifically for CPA tax filing for Tax Year {activeYear}.
          </p>
        </div>
        <button
          onClick={handleExportFullPackage}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export Complete Bundle ({activeYear})
        </button>
      </div>

      {/* Alert Banner */}
      {downloadSuccess && (
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{downloadSuccess}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Schedule C Expenses */}
        <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Schedule C Operating Expenses</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Categorized line-by-line operating expenses mapped directly to IRS Form 1040 Schedule C lines (Advertising, Legal, Office, Rent, Utilities).
            </p>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              {yearExpenses.length} records ready to export for {activeYear}
            </div>
          </div>
          <button
            onClick={handleExportScheduleC}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" />
            Download Schedule C CSV
          </button>
        </div>

        {/* Card 2: IRS Mileage Log */}
        <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">IRS 5-Point Mileage Ledger</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Compliant vehicle mileage log detailing Date, Origin, Destination, Business Purpose, Odometer readings, and IRS standard rate calculation.
            </p>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              {yearMileage.length} trips ready to export for {activeYear}
            </div>
          </div>
          <button
            onClick={handleExportMileage}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" />
            Download Mileage CSV
          </button>
        </div>

        {/* Card 3: Payroll Summary & Stubs */}
        <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Payroll & Tax Withholding</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Detailed paystub breakdown for Form W-2 / 941 preparation including Federal Income Tax, PA State Tax (3.07%), FICA, Medicare, and Local EIT.
            </p>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              {yearPayStubs.length} paystubs ready to export for {activeYear}
            </div>
          </div>
          <button
            onClick={handleExportPayroll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" />
            Download Payroll CSV
          </button>
        </div>
      </div>
    </div>
  );
}
