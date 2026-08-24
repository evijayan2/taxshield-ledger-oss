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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Year-End Accountant Export Package ({activeYear})
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Export structured financial data packages (CSV & Excel format) formatted specifically for CPA tax filing for Tax Year {activeYear}.
          </p>
        </div>
        <button
          onClick={handleExportFullPackage}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export Complete Bundle ({activeYear})
        </button>
      </div>

      {/* Alert Banner */}
      {downloadSuccess && (
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium">{downloadSuccess}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Schedule C Expenses */}
        <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Schedule C Operating Expenses</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Categorized line-by-line operating expenses mapped directly to IRS Form 1040 Schedule C lines (Advertising, Legal, Office, Rent, Utilities).
            </p>
            <div className="text-xs font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100 dark:border-slate-800">
              {yearExpenses.length} records ready to export for {activeYear}
            </div>
          </div>
          <button
            onClick={handleExportScheduleC}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-indigo-600 text-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-600 dark:text-white text-sm font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700 hover:border-indigo-500 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Schedule C CSV
          </button>
        </div>

        {/* Card 2: IRS Mileage Log */}
        <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">IRS 5-Point Mileage Ledger</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Compliant vehicle mileage log detailing Date, Origin, Destination, Business Purpose, Odometer readings, and IRS standard rate calculation.
            </p>
            <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-emerald-100 dark:border-slate-800">
              {yearMileage.length} trips ready to export for {activeYear}
            </div>
          </div>
          <button
            onClick={handleExportMileage}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-emerald-600 text-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 dark:text-white text-sm font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Mileage CSV
          </button>
        </div>

        {/* Card 3: Payroll Summary & Stubs */}
        <div className="glass-card p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payroll & Tax Withholding</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Detailed paystub breakdown for Form W-2 / 941 preparation including Federal Income Tax, PA State Tax (3.07%), FICA, Medicare, and Local EIT.
            </p>
            <div className="text-xs font-mono text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-100 dark:border-slate-800">
              {yearPayStubs.length} paystubs ready to export for {activeYear}
            </div>
          </div>
          <button
            onClick={handleExportPayroll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-amber-600 text-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-amber-600 dark:text-white text-sm font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700 hover:border-amber-500 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Payroll CSV
          </button>
        </div>
      </div>
    </div>
  );
}
