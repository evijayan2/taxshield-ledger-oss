import React, { useState, useMemo } from 'react';
import {
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type {
  BankImportBatch,
  BankTransaction,
  BankReconciliationStatus,
  CandidateMatch,
  Invoice,
  ContractorPayment,
} from 'taxshield-ledger-core';
import type { GeneralExpense, TravelExpense, PayrollRun } from 'taxshield-ledger-core';
import {
  parseBankCsv,
  reconcileBankBatch,
  findCandidateMatches,
} from 'taxshield-ledger-core';
import { BankCsvUploadDrawer } from './BankCsvUploadDrawer';
import { TransactionMatchDrawer } from './TransactionMatchDrawer';

interface ReconciliationViewProps {
  companyId: string;
  activeTaxYear: number;
  generalExpenses: GeneralExpense[];
  travelExpenses?: TravelExpense[];
  invoices: Invoice[];
  payrollRuns: PayrollRun[];
  contractorPayments: ContractorPayment[];
  bankBatches: BankImportBatch[];
  bankTransactions: BankTransaction[];
  onImportBatch: (batch: BankImportBatch, transactions: BankTransaction[]) => void;
  onUpdateTransaction: (updatedTx: BankTransaction) => void;
  onCreateExpenseFromBankTx: (bankTxId: string, expense: any) => void;
}

export function ReconciliationView({
  companyId,
  activeTaxYear,
  generalExpenses,
  travelExpenses = [],
  invoices,
  payrollRuns,
  contractorPayments,
  bankBatches,
  bankTransactions,
  onImportBatch,
  onUpdateTransaction,
  onCreateExpenseFromBankTx,
}: ReconciliationViewProps) {
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<BankTransaction | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');

  // Aggregate stats
  const stats = useMemo(() => {
    let total = bankTransactions.length;
    let matched = 0;
    let needsReview = 0;
    let unmatched = 0;
    let duplicate = 0;
    let netAmount = 0;

    for (const tx of bankTransactions) {
      if (tx.reconciliationStatus === 'MATCHED') matched++;
      else if (tx.reconciliationStatus === 'NEEDS_REVIEW') needsReview++;
      else if (tx.reconciliationStatus === 'UNMATCHED') unmatched++;
      else if (tx.reconciliationStatus === 'DUPLICATE') duplicate++;

      netAmount += tx.transactionType === 'CREDIT' ? tx.amount : -tx.amount;
    }

    const reconciliationRate = total > 0 ? Math.round((matched / total) * 100) : 100;

    return {
      total,
      matched,
      needsReview,
      unmatched,
      duplicate,
      netAmount: Math.round(netAmount * 100) / 100,
      reconciliationRate,
    };
  }, [bankTransactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return bankTransactions.filter((tx) => {
      if (filterStatus !== 'ALL' && tx.reconciliationStatus !== filterStatus) {
        return false;
      }
      if (typeFilter !== 'ALL' && tx.transactionType !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesPayee = tx.cleanPayee.toLowerCase().includes(query);
        const matchesDesc = tx.rawDescription.toLowerCase().includes(query);
        const matchesAmount = tx.amount.toString().includes(query);
        if (!matchesPayee && !matchesDesc && !matchesAmount) return false;
      }
      return true;
    });
  }, [bankTransactions, filterStatus, typeFilter, searchQuery]);

  // Compute candidate matches for the currently selected transaction in drawer
  const selectedCandidates = useMemo(() => {
    if (!selectedTx) return [];
    return findCandidateMatches(
      {
        amount: selectedTx.amount,
        postedDate: selectedTx.postedDate,
        cleanPayee: selectedTx.cleanPayee,
        rawDescription: selectedTx.rawDescription,
        transactionType: selectedTx.transactionType,
      },
      {
        generalExpenses,
        travelExpenses,
        invoices,
        payrollRuns,
        contractorPayments,
      }
    );
  }, [selectedTx, generalExpenses, travelExpenses, invoices, payrollRuns, contractorPayments]);

  // Handle statement import
  const handleImportComplete = (csvContent: string, fileName: string, accountName: string) => {
    const parseResult = parseBankCsv(csvContent, companyId);
    if (!parseResult.success) {
      throw new Error('Failed to parse bank statement CSV.');
    }

    const existingFingerprints = new Set(bankTransactions.map((t) => t.fingerprint));
    const batchId = crypto.randomUUID();

    const reconResult = reconcileBankBatch(
      parseResult.rows,
      companyId,
      batchId,
      {
        generalExpenses,
        travelExpenses,
        invoices,
        payrollRuns,
        contractorPayments,
      },
      existingFingerprints
    );

    const newBatch: BankImportBatch = {
      id: batchId,
      companyId,
      fileName,
      accountName,
      accountMask: parseResult.accountMask || null,
      totalRows: reconResult.summary.total,
      matchedCount: reconResult.summary.matched,
      reviewCount: reconResult.summary.needsReview,
      unmatchedCount: reconResult.summary.unmatched,
      duplicateCount: reconResult.summary.duplicate,
      netAmount: parseResult.netAmount,
      importedAt: new Date().toISOString(),
    };

    const newTransactions = reconResult.reconciledRows.map((r) => r.transaction);
    onImportBatch(newBatch, newTransactions);
  };

  // Confirm match handler
  const handleConfirmMatch = (
    bankTxId: string,
    entityType: string,
    entityId: string,
    notes?: string
  ) => {
    const tx = bankTransactions.find((t) => t.id === bankTxId);
    if (!tx) return;

    const updated: BankTransaction = {
      ...tx,
      reconciliationStatus: 'MATCHED',
      matchedEntityType: entityType as any,
      matchedEntityId: entityId,
      matchNotes: notes || 'Confirmed by owner',
      reconciledAt: new Date().toISOString(),
      reconciledBy: 'OWNER_MANUAL',
    };
    onUpdateTransaction(updated);
  };

  // Convert unmatched to expense handler
  const handleConvertExpense = (bankTxId: string, expenseData: any) => {
    const tx = bankTransactions.find((t) => t.id === bankTxId);
    if (!tx) return;

    const newExpense: GeneralExpense = {
      id: crypto.randomUUID(),
      expenseDate: tx.postedDate,
      category: expenseData.category,
      payee: tx.cleanPayee,
      description: expenseData.description,
      amount: tx.amount,
      paidBy: 'LLC_ACCOUNT',
      scheduleCLine: expenseData.scheduleCLine,
      isTaxDeductible: expenseData.isTaxDeductible,
      createdAt: new Date().toISOString(),
    };

    onCreateExpenseFromBankTx(bankTxId, newExpense);

    const updated: BankTransaction = {
      ...tx,
      reconciliationStatus: 'MATCHED',
      matchedEntityType: 'GENERAL_EXPENSE',
      matchedEntityId: newExpense.id,
      matchNotes: `Created new verified expense on Line ${expenseData.scheduleCLine}`,
      reconciledAt: new Date().toISOString(),
      reconciledBy: 'OWNER_CONVERT_EXPENSE',
    };
    onUpdateTransaction(updated);
  };

  // Ignore / transfer handler
  const handleIgnoreTransfer = (bankTxId: string) => {
    const tx = bankTransactions.find((t) => t.id === bankTxId);
    if (!tx) return;

    const updated: BankTransaction = {
      ...tx,
      reconciliationStatus: 'MATCHED',
      matchedEntityType: 'TRANSFER_INTERNAL',
      matchNotes: 'Marked as non-deductible owner transfer / personal draw',
      reconciledAt: new Date().toISOString(),
      reconciledBy: 'OWNER_IGNORE_TRANSFER',
    };
    onUpdateTransaction(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl glass-panel shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bank Statement Reconciliation
            </h1>
            <span className="badge-emerald font-semibold text-xs">
              {stats.reconciliationRate}% Reconciled
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Universal 4-way matching across Expenses, Invoices, Payroll, and 1099 Contractor Payments.
          </p>
        </div>

        <button
          onClick={() => setIsUploadDrawerOpen(true)}
          className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Import Bank CSV</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total Statement Rows
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">
            {stats.total}
          </p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {stats.matched}
          </p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs Review
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
            {stats.needsReview}
          </p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Unmatched
          </p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
            {stats.unmatched}
          </p>
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800 col-span-2 md:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Net Statement Flow
          </p>
          <p
            className={`text-2xl font-bold font-mono mt-1 ${
              stats.netAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {stats.netAmount >= 0 ? '+' : ''}$
            {stats.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl glass-panel">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: `All (${stats.total})` },
            { id: 'NEEDS_REVIEW', label: `Needs Review (${stats.needsReview})` },
            { id: 'UNMATCHED', label: `Unmatched (${stats.unmatched})` },
            { id: 'MATCHED', label: `Matched (${stats.matched})` },
            { id: 'DUPLICATE', label: `Duplicates (${stats.duplicate})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterStatus === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Polarity Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search payee or amount..."
              className="glass-input pl-9 pr-3 py-1.5 text-xs rounded-lg w-full sm:w-60"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="glass-input px-3 py-1.5 text-xs rounded-lg dark:bg-slate-900"
          >
            <option value="ALL">All Types</option>
            <option value="DEBIT">Debits Only</option>
            <option value="CREDIT">Credits Only</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No transactions found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {bankTransactions.length === 0
                ? 'Import a bank CSV statement to automatically reconcile debits and credits against your ledger.'
                : 'No transactions match the selected filter criteria.'}
            </p>
            {bankTransactions.length === 0 && (
              <button
                onClick={() => setIsUploadDrawerOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Import First Bank CSV
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Posting Date</th>
                  <th className="py-3 px-4">Payee & Bank Memo</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Reconciliation Status</th>
                  <th className="py-3 px-4">Matched Entity</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedTx(tx)}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                      {tx.postedDate}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {tx.cleanPayee}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-md">
                        {tx.rawDescription}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      <span
                        className={
                          tx.transactionType === 'DEBIT'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {tx.transactionType === 'DEBIT' ? '-' : '+'}$
                        {tx.amount.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={
                          tx.reconciliationStatus === 'MATCHED'
                            ? 'badge-emerald'
                            : tx.reconciliationStatus === 'NEEDS_REVIEW'
                            ? 'badge-amber'
                            : tx.reconciliationStatus === 'DUPLICATE'
                            ? 'badge-slate'
                            : 'badge-rose'
                        }
                      >
                        {tx.reconciliationStatus.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {tx.matchedEntityType ? (
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-xs">
                            {tx.matchedEntityType.replace('_', ' ')}: {tx.matchNotes || 'Linked'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                          Unlinked
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {tx.reconciliationStatus === 'MATCHED' ? 'View' : 'Review Match'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-Over Drawers */}
      <BankCsvUploadDrawer
        isOpen={isUploadDrawerOpen}
        onClose={() => setIsUploadDrawerOpen(false)}
        companyId={companyId}
        onImportComplete={handleImportComplete}
      />

      <TransactionMatchDrawer
        isOpen={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
        candidates={selectedCandidates}
        onConfirmMatch={handleConfirmMatch}
        onConvertExpense={handleConvertExpense}
        onIgnoreTransfer={handleIgnoreTransfer}
      />
    </div>
  );
}
