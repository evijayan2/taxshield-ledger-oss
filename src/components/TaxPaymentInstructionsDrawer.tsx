import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  CreditCard, 
  FileText, 
  Copy, 
  Check, 
  ShieldCheck,
  AlertCircle,
  Lock
} from 'lucide-react';
import { ComplianceTask, Organization } from '../types';
import { TAX_REMITTANCE_GUIDES, TaxRemittanceInfo } from '../utils/taxPaymentGuideData';
import { isFutureYear, getTaskTaxYear } from '../utils/taxEngine';

interface TaxPaymentInstructionsDrawerProps {
  task?: ComplianceTask | null;
  org?: Organization | null;
  guideKey?: string;
  onClose: () => void;
  onMarkTaskFiled?: (taskId: string, confirmationNum: string, taskDetails?: Partial<ComplianceTask>) => void;
}

export function TaxPaymentInstructionsDrawer({
  task,
  org,
  guideKey,
  onClose,
  onMarkTaskFiled
}: TaxPaymentInstructionsDrawerProps) {
  const [confirmationInput, setConfirmationInput] = useState<string>('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isPayingMercury, setIsPayingMercury] = useState(false);
  const [mercuryPaymentResult, setMercuryPaymentResult] = useState<{
    success: boolean;
    message?: string;
    transferId?: string;
    txpAddenda?: string;
    error?: string;
  } | null>(null);

  const taskTaxYear = task ? getTaskTaxYear(task) : 2026;
  const isFutureYearTask = isFutureYear(taskTaxYear);
  const isAlreadyPaid = task?.status === 'FILED' || Boolean(task?.confirmationNumber);

  const handlePayMercury = async () => {
    if (!task || !org?.mercuryApiKey) return;
    if (isFutureYearTask) {
      setMercuryPaymentResult({
        success: false,
        error: `Tax filing and ACH disbursements are locked for future tax year (${taskTaxYear}).`,
      });
      return;
    }
    if (isAlreadyPaid) {
      setMercuryPaymentResult({
        success: false,
        error: `Tax return (${task.formIdentifier || task.title}) has already been marked as paid & filed. Duplicate ACH disbursements are blocked.`,
      });
      return;
    }
    setIsPayingMercury(true);
    setMercuryPaymentResult(null);

    try {
      const res = await fetch('/api/mercury/disburse-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: org.mercuryApiKey,
          environment: org.mercuryEnvironment || 'SANDBOX',
          accountId: org.mercuryAccountId || 'acc_default',
          task,
          company: org,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const transferRef = data.transferId || `MERCURY-${Date.now()}`;
        setConfirmationInput(transferRef);
        setMercuryPaymentResult({
          success: true,
          message: data.message || 'Payment disbursed via Mercury ACH API!',
          transferId: transferRef,
          txpAddenda: data.txpAddenda,
        });
        if (onMarkTaskFiled && task) {
          onMarkTaskFiled(task.id, transferRef, task);
        }
      } else {
        setMercuryPaymentResult({
          success: false,
          error: data.error || 'Failed to disburse payment via Mercury API.',
        });
      }
    } catch (err: any) {
      setMercuryPaymentResult({
        success: false,
        error: err.message || 'Network error processing Mercury ACH payment.',
      });
    } finally {
      setIsPayingMercury(false);
    }
  };

  // Match guide by explicit guideKey prop, task formIdentifier, or jurisdiction
  let resolvedGuideKey = guideKey || 'FEDERAL_941';
  if (!guideKey && task) {
    if (task.formIdentifier === 'REV_1667' || task.jurisdiction?.includes('SIT')) {
      resolvedGuideKey = 'PA_SIT_REV1667';
    } else if (task.formIdentifier === 'PA_UC_2' || task.jurisdiction?.includes('UC')) {
      resolvedGuideKey = 'PA_UC2';
    } else if (task.formIdentifier === 'W2_W3' || task.jurisdiction?.includes('W2')) {
      resolvedGuideKey = 'W2_W3_BUNDLE';
    } else if (task.jurisdiction?.includes('LOCAL') || task.formIdentifier?.includes('EIT')) {
      resolvedGuideKey = 'PA_LOCAL_EIT';
    }
  }

  const guide: TaxRemittanceInfo = TAX_REMITTANCE_GUIDES[resolvedGuideKey] || TAX_REMITTANCE_GUIDES.FEDERAL_941;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFutureYearTask) return;
    const refNum = confirmationInput.trim() || `CONF-${Math.floor(Math.random() * 899999 + 100000)}`;
    if (task && onMarkTaskFiled) {
      onMarkTaskFiled(task.id, refNum, task);
    }
    onClose();
  };

  const amountDue = task?.amountDue ?? 0;
  const taxPeriodLabel = task?.taxPeriodLabel || 'Current Tax Period';
  const dueDate = task?.dueDate || 'Upcoming';
  const orgName = org?.name || 'Micro-LLC Ledger';
  const orgEin = org?.ein || 'Not Set';
  const portalShortName = guide?.portalName ? guide.portalName.split(' ')[0] : 'Portal';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                {guide.formIdentifier.replace('_', ' ')}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {guide.formTitle || guide.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official Tax Form: <strong className="text-slate-700 dark:text-slate-300">{guide.formIdentifier.replace('_', ' ')}</strong> • Agency: {guide.agencyName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Already Paid Banner */}
          {isAlreadyPaid && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Tax Remittance Paid & Completed</h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">This tax return has already been remitted and logged in the audit trail.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                  FILED & PAID
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 font-mono text-[11px] text-emerald-950 dark:text-emerald-100">
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block font-sans">Confirmation Ref / ACH ID</span>
                  <span className="font-bold">{task?.confirmationNumber || 'LOGGED'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block font-sans">Filing Date</span>
                  <span>{task?.filedDate || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block font-sans">Amount Remitted</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">${amountDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status & Amount Due Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-800/60 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Total Amount to Remit</span>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                ${amountDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Form: {guide.formIdentifier.replace('_', ' ')} • Tax Period: {taxPeriodLabel} • Due Date: {dueDate}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={handlePayMercury}
                disabled={isPayingMercury || !org?.mercuryApiKey || isAlreadyPaid}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md ${
                  isAlreadyPaid
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-not-allowed'
                    : org?.mercuryApiKey
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
                title={isAlreadyPaid ? 'Tax return is already paid & filed' : org?.mercuryApiKey ? `Pay ${guide.formIdentifier} via Mercury ACH API` : 'Configure Mercury API key in Company Setup first'}
              >
                {isAlreadyPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <CreditCard className="w-4 h-4" />}
                <span>{isAlreadyPaid ? 'Already Disbursed & Paid' : isPayingMercury ? 'Transmitting ACH...' : `Pay ${guide.formIdentifier.replace('_', ' ')} via Mercury ACH (${org?.mercuryEnvironment || 'SANDBOX'})`}</span>
              </button>

              <a
                href={guide.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <span>Manual Portal ({portalShortName})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Mercury API Feedback Banner */}
          {mercuryPaymentResult && (
            <div className={`p-4 rounded-xl text-xs space-y-1.5 border ${
              mercuryPaymentResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {mercuryPaymentResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{mercuryPaymentResult.message || mercuryPaymentResult.error}</span>
              </div>
              {mercuryPaymentResult.txpAddenda && (
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">NACHA TXP Addenda Record Transmitted:</span>
                  <code className="text-[11px] font-mono px-2 py-1 rounded bg-slate-900 text-emerald-400 block overflow-x-auto mt-0.5">
                    {mercuryPaymentResult.txpAddenda}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Business Credentials Needed */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>Entity Payment Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Employer Name</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{orgName}</span>
                </div>
                <button
                  onClick={() => handleCopy(orgName, 'name')}
                  className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  title="Copy Name"
                >
                  {copiedText === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Employer EIN</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{orgEin}</span>
                </div>
                {orgEin !== 'Not Set' && (
                  <button
                    onClick={() => handleCopy(orgEin, 'ein')}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                    title="Copy EIN"
                  >
                    {copiedText === 'ein' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tax Components Included */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Withholding & Liability Breakdown</span>
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-950/40">
              {guide.componentsIncluded.map((comp, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{comp.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{comp.rateOrCalculation}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    comp.paidBy === 'EMPLOYER' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                      : comp.paidBy === 'EMPLOYEE'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                  }`}>
                    {comp.paidBy}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Payment Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Step-by-Step Deposit & Payment Guide</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              {guide.stepByStepInstructions.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form Preparation Notes */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Filing Form Preparation Notes ({guide.formIdentifier})</span>
            </h4>
            <ul className="space-y-1.5 pl-5 list-disc text-xs text-amber-900 dark:text-amber-200/80">
              {guide.filingPreparationNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          {/* Record Confirmation & Mark Filed */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Tax Payment & Filing Record</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFutureYearTask
                  ? `Tax filing and remittance for future tax year (${taskTaxYear}) are locked.`
                  : isAlreadyPaid
                  ? `Payment and filing confirmation is locked in the immutable audit trail.`
                  : `After completing your payment on ${guide.portalName}, enter the government confirmation number below to log this transaction into the audit trail.`}
              </p>
            </div>

            {isFutureYearTask ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3 text-xs">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-extrabold text-amber-900 dark:text-amber-100 block">Future Tax Year Locked ({taskTaxYear})</span>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Executing tax filings or disbursing ACH payments for future tax years is locked until tax year {taskTaxYear} begins.
                  </p>
                </div>
              </div>
            ) : isAlreadyPaid ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-900 dark:text-emerald-100 block">Filing Lock Active</span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Confirmation / ACH Trace Reference: <code className="font-mono font-bold">{task?.confirmationNumber || 'LOGGED'}</code> — This tax return is finalized and protected against double payment.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder="e.g. EFTPS-98472918 or myPATH-30492"
                    className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isFutureYearTask}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                      isFutureYearTask
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer'
                    }`}
                  >
                    {isFutureYearTask ? <Lock className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Mark Paid & Filed</span>
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
