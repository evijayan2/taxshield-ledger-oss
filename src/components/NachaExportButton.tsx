import React, { useState } from 'react';
import { Download, AlertCircle, CheckCircle2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generatePayrollNachaBatch } from 'taxshield-ledger-core';
import { Organization, Employee, PayStub } from '../types';

interface NachaExportButtonProps {
  org: Organization;
  employees: Employee[];
  payStubs: PayStub[];
  onUpdateStubDisbursement: (stubId: string, achRef: string) => void;
}

/**
 * Initiates browser download of text content as an attachment.
 */
function triggerFileDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Universal NACHA PPD Direct Deposit batch generation and download trigger button.
 */
export function NachaExportButton({
  org,
  employees,
  payStubs,
  onUpdateStubDisbursement,
}: NachaExportButtonProps): React.JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pendingStubs = payStubs.filter(
    s => (s.disbursementMethod || 'ACH') === 'ACH' && s.disbursementStatus === 'PENDING' && s.netPay > 0
  );

  const handleDownload = () => {
    try {
      if (!org.routingNumber) {
        setError('Company bank routing number is missing. Please configure your routing number in Company Settings.');
        return;
      }
      if (pendingStubs.length === 0) {
        setError('No pending ACH paystubs available for direct deposit file generation.');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const result = generatePayrollNachaBatch(
        org as any,
        pendingStubs as any,
        employees as any,
        {
          effectiveEntryDate: today,
          companyEntryDescription: 'PAYROLL',
        }
      );

      triggerFileDownload(result.fileContent, `nacha-direct-deposit-${today}.ach`);

      result.updatedPayStubs.forEach(item => {
        onUpdateStubDisbursement(item.payStubId, item.achTraceRef);
      });

      confetti({ particleCount: 50, spread: 70 });
      setSuccess(`Generated 94-char NACHA PPD file for ${result.entryCount} direct deposit transfers!`);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate NACHA file');
      setSuccess(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleDownload}
        disabled={pendingStubs.length === 0}
        title={pendingStubs.length === 0 ? 'No pending direct deposit transfers' : 'Download official 94-character fixed-width NACHA file for bank portal upload'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shadow-sm cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download NACHA PPD (.ach)</span>
      </button>

      {error && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[11px] border border-rose-200 dark:border-rose-900/60 max-w-sm">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-75 cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] border border-emerald-200 dark:border-emerald-900/60 max-w-sm">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="hover:opacity-75 cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
