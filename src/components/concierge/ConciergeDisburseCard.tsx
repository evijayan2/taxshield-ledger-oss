import React from 'react';
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
        Download standard 94-character NACHA PPD direct deposit file and upload it to your business banking portal.
      </p>
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {currentStubs.length} employee(s) • Pay Date: {payrollRun.payDate}
        </span>
        <NachaExportButton
          org={company}
          employees={employees}
          payStubs={currentStubs}
          onUpdateStubDisbursement={onUpdateStubDisbursement || (() => {})}
        />
      </div>
    </div>
  );
}
