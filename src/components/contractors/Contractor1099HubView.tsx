import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Send, 
  DollarSign, 
  Download 
} from 'lucide-react';
import type { 
  FormW9Record, 
  ContractorPayment, 
  ContractorComplianceSummary 
} from 'taxshield-ledger-core';
import { evaluateContractor1099Status, isCorporateExempt, generateIrisCsvManifest } from 'taxshield-ledger-core';
import { W9InviteDrawer, ContractorOption } from './W9InviteDrawer';
import { ContractorPaymentDrawer } from './ContractorPaymentDrawer';
import { ContractorRosterTable } from './ContractorRosterTable';
import { generateForm1099NecPdf } from '../../utils/form1099PdfBuilder';
import type { NewContractorInput } from './NewContractorForm';

export interface ContractorWorker {
  id: string;
  name: string;
  email: string;
  phone?: string;
  workerClassification?: string;
  w9Record?: FormW9Record | null;
  payments: ContractorPayment[];
}

export interface Contractor1099HubViewProps {
  contractors: ContractorWorker[];
  payerProfile: {
    name: string;
    tin: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  activeTaxYear: number;
  statutoryThreshold?: number;
  onRecordPayment: (payment: any) => void;
  onInviteGenerated: (contractorId: string, tokenHash: string) => void;
  onAddContractor?: (contractor: NewContractorInput) => string;
}

/**
 * Contractor W-9 Hub & 1099-NEC Threshold Tracking Dashboard.
 */
export function Contractor1099HubView({
  contractors,
  payerProfile,
  activeTaxYear,
  statutoryThreshold = 600.0,
  onRecordPayment,
  onInviteGenerated,
  onAddContractor,
}: Contractor1099HubViewProps) {
  const [showInviteDrawer, setShowInviteDrawer] = useState(false);
  const [inviteMode, setInviteMode] = useState<'new' | 'existing'>('new');
  const [targetContractorId, setTargetContractorId] = useState<string | undefined>(undefined);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);

  // Calculate summaries dynamically (AD-3)
  const summaries: ContractorComplianceSummary[] = contractors.map((c) => {
    const ytdTotal = (c.payments || []).reduce((acc, p) => acc + p.amount, 0);
    const hasW9 = !!c.w9Record?.certifiedSignature;
    const classification = c.w9Record?.taxClassification;
    const corporateExempt = isCorporateExempt(classification);
    const status = evaluateContractor1099Status(ytdTotal, statutoryThreshold, hasW9, classification);

    return {
      employeeId: c.id,
      contractorName: c.name,
      businessName: c.w9Record?.businessName,
      tinMasked: c.w9Record?.tinMasked || null,
      hasCertifiedW9: hasW9,
      isCorporateExempt: corporateExempt,
      ytdTotalPaid: ytdTotal,
      thresholdAmount: statutoryThreshold,
      status,
      is1099Eligible: !corporateExempt && ytdTotal >= statutoryThreshold && hasW9,
    };
  });

  const totalContractors = summaries.length;
  const ready1099Count = summaries.filter((s) => s.status === 'THRESHOLD_MET').length;
  const missingW9Count = summaries.filter((s) => s.status === 'MISSING_W9').length;
  const totalDisbursed = summaries.reduce((acc, s) => acc + s.ytdTotalPaid, 0);

  const handleOpenInvite = (contractorId?: string) => {
    setTargetContractorId(contractorId);
    setInviteMode(contractorId ? 'existing' : contractors.length > 0 ? 'existing' : 'new');
    setShowInviteDrawer(true);
  };

  const handleOpenAddNewContractor = () => {
    setTargetContractorId(undefined);
    setInviteMode('new');
    setShowInviteDrawer(true);
  };

  const handleDownload1099 = (summary: ContractorComplianceSummary) => {
    const contractor = contractors.find((c) => c.id === summary.employeeId);
    const doc = generateForm1099NecPdf(
      {
        legalName: summary.contractorName,
        businessName: summary.businessName,
        tinPlain: summary.tinMasked || '***-**-****',
        address: contractor?.w9Record?.address || 'Address on file',
        city: contractor?.w9Record?.city || 'Philadelphia',
        state: contractor?.w9Record?.state || 'PA',
        zip: contractor?.w9Record?.zipCode || '19104',
        box1Compensation: summary.ytdTotalPaid,
      },
      payerProfile,
      activeTaxYear.toString()
    );
    doc.save(`Form1099NEC_${summary.contractorName.replace(/\s+/g, '_')}_${activeTaxYear}.pdf`);
  };

  const handleExportIrisCsv = () => {
    const payees = summaries
      .filter((s) => s.status === 'THRESHOLD_MET')
      .map((s) => {
        const c = contractors.find((w) => w.id === s.employeeId);
        return {
          tinType: (c?.w9Record?.tinType === 'EIN' ? '1' : '2') as '1' | '2',
          tinPlain: s.tinMasked || '123456789',
          legalName: s.contractorName,
          businessName: s.businessName || undefined,
          address: c?.w9Record?.address || '100 Main St',
          city: c?.w9Record?.city || 'Philadelphia',
          state: c?.w9Record?.state || 'PA',
          zipCode: c?.w9Record?.zipCode || '19104',
          compensationAmount: s.ytdTotalPaid,
        };
      });

    const csvContent = generateIrisCsvManifest(payerProfile.tin, payerProfile.name, activeTaxYear.toString(), payees);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IRS_IRIS_1099NEC_Manifest_${activeTaxYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const contractorOptions: ContractorOption[] = contractors.map((c) => {
    const ytd = (c.payments || []).reduce((acc, p) => acc + p.amount, 0);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      businessName: c.w9Record?.businessName,
      tinMasked: c.w9Record?.tinMasked,
      taxClassification: c.w9Record?.taxClassification,
      hasCertifiedW9: !!c.w9Record?.certifiedSignature,
      ytdTotalPaid: ytd,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-5 sm:w-6 h-5 sm:h-6 text-indigo-500 shrink-0" />
            <span>Contractor W-9 Hub & 1099-NEC</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Collect Form W-9s, monitor the statutory ${statutoryThreshold.toFixed(0)} threshold dynamically, and generate IRS Form 1099-NEC e-file manifests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenAddNewContractor}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Contractor
          </button>
          <button
            onClick={() => handleOpenInvite()}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" /> Send W-9 Invite
          </button>
          <button
            onClick={() => setShowPaymentDrawer(true)}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <DollarSign className="w-4 h-4" /> Log Payment
          </button>
          <button
            onClick={handleExportIrisCsv}
            disabled={ready1099Count === 0}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export IRIS CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active 1099 Talent</p>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5">{totalContractors}</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">1099-NEC Ready (&ge; ${statutoryThreshold.toFixed(0)})</p>
          <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1.5">{ready1099Count}</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Missing W-9s</p>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1.5">{missingW9Count}</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Disbursements ({activeTaxYear})</p>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">${totalDisbursed.toFixed(2)}</p>
        </div>
      </div>

      {/* Roster Table */}
      <ContractorRosterTable
        summaries={summaries}
        contractors={contractors}
        statutoryThreshold={statutoryThreshold}
        onDownload1099={handleDownload1099}
        onOpenInvite={handleOpenInvite}
        onOpenAddContractor={handleOpenAddNewContractor}
      />

      {/* Drawers */}
      <W9InviteDrawer
        isOpen={showInviteDrawer}
        onClose={() => setShowInviteDrawer(false)}
        initialMode={inviteMode}
        initialContractorId={targetContractorId}
        contractors={contractorOptions}
        companyName={payerProfile.name}
        onInviteGenerated={onInviteGenerated}
        onAddContractor={onAddContractor}
      />

      <ContractorPaymentDrawer
        isOpen={showPaymentDrawer}
        onClose={() => setShowPaymentDrawer(false)}
        contractors={contractors.map((c) => ({ id: c.id, name: c.name }))}
        activeTaxYear={activeTaxYear}
        onRecordPayment={onRecordPayment}
      />
    </div>
  );
}
