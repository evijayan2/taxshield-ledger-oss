import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { parseBankCsv, BankCsvParseResult } from 'taxshield-ledger-core';

interface BankCsvUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onImportComplete: (csvContent: string, fileName: string, accountName: string) => Promise<void> | void;
}

const SAMPLE_MERCURY_CSV = `"Date","Description","Amount","FITID"
"2026-05-01","Amazon Web Services","-$142.50","tx_merc_001"
"2026-05-02","Stripe Payouts Client Retainer","$6500.00","tx_merc_002"
"2026-05-05","Gusto Payroll Taxes & Net Pay","-$2550.00","tx_merc_003"
"2026-05-08","ACH Out to Dave Designer","-$750.00","tx_merc_004"
"2026-05-12","Staples #0129 Office Supplies","-$84.50","tx_merc_005"
"2026-05-15","GitHub Copilot Team Sub","-$42.00","tx_merc_006"`;

const SAMPLE_CHASE_CSV = `Posting Date,Description,Amount,Type,Balance,Check or Slip #
05/01/2026,POS DEBIT STAPLES 0129,-84.50,DEBIT,14250.00,
05/03/2026,DIRECT DEPOSIT ACME CORP CLIENT,6500.00,CREDIT,20750.00,
05/06/2026,ACH WITHDRAWAL GUSTO PAYROLL,-2550.00,DEBIT,18200.00,
05/09/2026,WIRE TRANSFER OUT TO DAVE DESIGNER,-750.00,DEBIT,17450.00,`;

export function BankCsvUploadDrawer({
  isOpen,
  onClose,
  companyId,
  onImportComplete,
}: BankCsvUploadDrawerProps) {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [accountName, setAccountName] = useState('Operating Checking');
  const [parseResult, setParseResult] = useState<BankCsvParseResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseContent = (content: string, name: string) => {
    setCsvContent(content);
    setFileName(name);
    setError(null);

    try {
      const result = parseBankCsv(content, companyId);
      setParseResult(result);
      if (!result.success && result.warnings.length > 0) {
        setError(result.warnings[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleParseContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (type: 'mercury' | 'chase') => {
    if (type === 'mercury') {
      handleParseContent(SAMPLE_MERCURY_CSV, 'mercury_statement_may2026.csv');
      setAccountName('Mercury Checking (****4492)');
    } else {
      handleParseContent(SAMPLE_CHASE_CSV, 'chase_statement_may2026.csv');
      setAccountName('Chase Business Premier (****9104)');
    }
  };

  const handleSubmit = async () => {
    if (!csvContent || !parseResult?.success) {
      setError('Please provide a valid bank statement CSV with at least one transaction.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onImportComplete(csvContent, fileName || 'bank_statement.csv', accountName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import and reconcile bank transactions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex pl-0 sm:pl-10">
        <div className="w-full glass-panel shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Upload className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Import Bank Statement CSV
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Universal dialect parsing for Mercury, Chase, BofA, Wells Fargo & custom CSVs.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>
              </div>
            )}

            {/* Quick Sample Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Quick Test Samples:
              </span>
              <button
                type="button"
                onClick={() => handleLoadSample('mercury')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Mercury (6 txs)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('chase')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Chase (4 txs)
              </button>
            </div>

            {/* Account Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bank Account Label
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm rounded-lg"
                  placeholder="e.g. Mercury Checking"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Statement File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm rounded-lg"
                  placeholder="e.g. statement_may2026.csv"
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Upload CSV File
              </label>
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30">
                <FileText className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Click to select bank statement CSV
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports comma, tab, or semicolon separated files
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Or Paste Raw CSV Text */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Or Paste Raw Statement CSV
              </label>
              <textarea
                value={csvContent}
                onChange={(e) => handleParseContent(e.target.value, fileName || 'pasted_statement.csv')}
                rows={5}
                className="w-full glass-input px-3 py-2 text-xs font-mono rounded-lg"
                placeholder={`"Date","Description","Amount"\n"2026-05-01","Staples #0129","-$84.50"`}
              />
            </div>

            {/* Parsed Summary & Preview */}
            {parseResult?.success && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Rows</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                      {parseResult.totalRows}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3" /> Debits
                    </p>
                    <p className="text-lg font-bold text-rose-700 dark:text-rose-400 font-mono">
                      ${parseResult.totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> Credits
                    </p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      ${parseResult.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Net Flow</p>
                    <p className={`text-lg font-bold font-mono ${parseResult.netAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {parseResult.netAmount >= 0 ? '+' : ''}${parseResult.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Parsed Transactions Preview (Showing up to 6 rows)
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-56 overflow-y-auto">
                    {parseResult.rows.slice(0, 6).map((r, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{r.cleanPayee}</span>
                            <span className={r.transactionType === 'DEBIT' ? 'badge-rose' : 'badge-emerald'}>
                              {r.transactionType}
                            </span>
                          </div>
                          <p className="text-slate-400 dark:text-slate-500 text-[11px] truncate max-w-sm mt-0.5">
                            {r.date} • {r.rawDescription}
                          </p>
                        </div>
                        <div className="text-right font-mono font-semibold">
                          <span className={r.transactionType === 'DEBIT' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            {r.transactionType === 'DEBIT' ? '-' : '+'}${r.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parseResult?.success || isSubmitting}
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Importing & Reconciling...' : `Confirm & Import ${parseResult?.totalRows || 0} Transactions`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
