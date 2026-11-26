import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { PayrollRun, PayStub, Employee, Organization } from '../../types';
import { NachaExportButton } from '../NachaExportButton';

export interface ConciergeDisburseCardProps {
  payrollRun: PayrollRun;
  payStubs: PayStub[];
  employees: Employee[];
  company: Organization;
  onUpdateStubDisbursement?: (stubId: string, achRef: string) => void;
}

export function ConciergeDisburseCard({
  payrollRun,
  payStubs,
  employees,
  company,
  onUpdateStubDisbursement,
}: ConciergeDisburseCardProps) {
  const currentStubs = payStubs.filter((s) => s.payrollRunId === payrollRun.id);
  const [isSendingMercury, setIsSendingMercury] = useState(false);
  const [mercuryStatus, setMercuryStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const pendingStubs = currentStubs.filter((s) => s.disbursementStatus !== 'PAID' && s.netPay > 0);
  const hasMercuryKey = Boolean(company.mercuryApiKey?.trim());

  const handlePayViaMercury = async () => {
    if (!hasMercuryKey || pendingStubs.length === 0) return;
    setIsSendingMercury(true);
    setMercuryStatus(null);
    let paidCount = 0;
    try {
      for (const stub of pendingStubs) {
        const emp = employees.find((e) => e.id === stub.employeeId);
        if (!emp?.routingNumber || !emp?.accountNumber) {
          throw new Error(`${emp ? `${emp.firstName} ${emp.lastName}` : 'Employee'} is missing bank routing or account number.`);
        }
        const res = await fetch('/api/mercury/disburse-salary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: company.mercuryApiKey,
            environment: company.mercuryEnvironment || 'SANDBOX',
            accountId: company.mercuryAccountId,
            payStubId: stub.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            routingNumber: emp.routingNumber,
            accountNumber: emp.accountNumber,
            accountType: emp.accountType || 'CHECKING',
            amount: stub.netPay,
            paymentReference: `Payroll ${payrollRun.payDate} - ${emp.firstName} ${emp.lastName}`,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Mercury salary payment failed for ${emp.firstName} ${emp.lastName}.`);
        }
        onUpdateStubDisbursement?.(stub.id, data.transferId);
        paidCount += 1;
      }
      setMercuryStatus({
        type: 'success',
        message: `Disbursed ${paidCount} salary payment(s) via Mercury API.`,
      });
    } catch (err: any) {
      setMercuryStatus({ type: 'error', message: err.message || 'Mercury salary disbursement failed.' });
    } finally {
      setIsSendingMercury(false);
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-mono font-bold">
            1
          </span>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Disburse Net Pay (Direct Deposit)</h3>
        </div>
        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
          ${payrollRun.totalNetPay.toFixed(2)} Net
        </span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Pay employees directly via Mercury Bank API or download a 94-character NACHA PPD direct deposit file.
      </p>
      {mercuryStatus && (
        <div className={`p-2 rounded-lg flex items-center gap-2 text-[11px] ${mercuryStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
          {mercuryStatus.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          <span>{mercuryStatus.message}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {currentStubs.length} employee(s) • Pay Date: {payrollRun.payDate}
        </span>
        <div className="flex items-center gap-2">
          {hasMercuryKey && (
            <button
              type="button"
              disabled={isSendingMercury || pendingStubs.length === 0}
              onClick={handlePayViaMercury}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingMercury ? 'Sending...' : pendingStubs.length === 0 ? 'All Paid' : 'Pay via Mercury API'}</span>
            </button>
          )}
          <NachaExportButton
            org={company}
            employees={employees}
            payStubs={currentStubs}
            onUpdateStubDisbursement={onUpdateStubDisbursement || (() => {})}
          />
        </div>
      </div>
    </div>
  );
}
