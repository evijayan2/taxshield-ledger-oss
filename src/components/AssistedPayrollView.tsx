import React, { useState } from 'react';
import { 
  Calculator, 
  Play, 
  CheckCircle2, 
  Send, 
  FileText, 
  Copy, 
  Check, 
  Sparkles,
  Printer,
  Download,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Employee, Organization, PayrollRun, PayStub, MileageLog, TravelExpense, TimesheetEntry } from '../types';
import { calculateGrossToNet, getRecordYear, isFutureYear, isFutureDateString } from '../utils/taxEngine';
import { printPayStubPdf, savePayStubPdf } from '../utils/payStubPdfBuilder';
import { getApprovedHoursForEmployee } from '../utils/timesheetUtils';
import { calculateNextPayrollPeriod } from '../utils/payrollDateUtils';

interface AssistedPayrollViewProps {
  employees: Employee[];
  org: Organization;
  payrollRuns: PayrollRun[];
  payStubs: PayStub[];
  mileageLogs: MileageLog[];
  travelExpenses: TravelExpense[];
  timesheets?: TimesheetEntry[];
  activeTaxYear?: number;
  onCreatePayrollRun: (
    runData: Omit<PayrollRun, 'id' | 'createdAt'>,
    stubsData: Omit<PayStub, 'id' | 'payrollRunId' | 'createdAt'>[]
  ) => void;
  onUpdateStubDisbursement: (stubId: string, achRef: string) => void;
}

export function AssistedPayrollView({
  employees,
  org,
  payrollRuns = [],
  payStubs = [],
  mileageLogs = [],
  travelExpenses = [],
  timesheets = [],
  activeTaxYear = 2026,
  onCreatePayrollRun,
  onUpdateStubDisbursement
}: AssistedPayrollViewProps) {
  const yearPayrollRuns = payrollRuns.filter(p => getRecordYear(p.payDate || p.periodStart) === activeTaxYear);
  const yearPayStubs = payStubs.filter(s => getRecordYear(s.payDate || s.periodStart) === activeTaxYear);

  const [showRunModal, setShowRunModal] = useState(false);
  const [copiedAchId, setCopiedAchId] = useState<string | null>(null);
  const [autoFillFeedback, setAutoFillFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Auto-calculate smart default payroll period based on LLC setup payFrequency & history
  const calculatedPeriod = React.useMemo(() => {
    return calculateNextPayrollPeriod(employees, payrollRuns, timesheets, org);
  }, [employees, payrollRuns, timesheets, org]);

  const [periodStart, setPeriodStart] = useState(calculatedPeriod.periodStart);
  const [periodEnd, setPeriodEnd] = useState(calculatedPeriod.periodEnd);
  const [payDate, setPayDate] = useState(calculatedPeriod.payDate);

  // Sync dates when calculated period changes or modal opens
  React.useEffect(() => {
    setPeriodStart(calculatedPeriod.periodStart);
    setPeriodEnd(calculatedPeriod.periodEnd);
    setPayDate(calculatedPeriod.payDate);
  }, [calculatedPeriod]);

  // Map employee hours for current run
  const [employeeHoursMap, setEmployeeHoursMap] = useState<Record<string, { regular: number; overtime: number }>>(() => {
    const initial: Record<string, { regular: number; overtime: number }> = {};
    const approvedCountForPeriod = timesheets.filter(
      (t) => t.status === 'APPROVED' && t.workDate >= periodStart && t.workDate <= periodEnd
    ).length;

    employees.forEach(emp => {
      const h = getApprovedHoursForEmployee(timesheets, emp.id, periodStart, periodEnd);
      initial[emp.id] = (approvedCountForPeriod > 0 || h.regular > 0 || h.overtime > 0)
        ? { regular: h.regular, overtime: h.overtime }
        : { regular: 40, overtime: 0 };
    });
    return initial;
  });

  // Auto-fill hours from approved timesheets whenever dates or timesheets change
  React.useEffect(() => {
    setEmployeeHoursMap((prevMap) => {
      let hasChanges = false;
      const nextMap: Record<string, { regular: number; overtime: number }> = { ...prevMap };
      const approvedCountForPeriod = timesheets.filter(
        (t) => t.status === 'APPROVED' && t.workDate >= periodStart && t.workDate <= periodEnd
      ).length;

      employees.forEach((emp) => {
        const h = getApprovedHoursForEmployee(timesheets, emp.id, periodStart, periodEnd);
        const targetRegular = (approvedCountForPeriod > 0 || h.regular > 0 || h.overtime > 0)
          ? h.regular
          : (prevMap[emp.id]?.regular ?? 40);
        const targetOvertime = (approvedCountForPeriod > 0 || h.regular > 0 || h.overtime > 0)
          ? h.overtime
          : (prevMap[emp.id]?.overtime ?? 0);

        const current = prevMap[emp.id];
        if (!current || current.regular !== targetRegular || current.overtime !== targetOvertime) {
          nextMap[emp.id] = { regular: targetRegular, overtime: targetOvertime };
          hasChanges = true;
        }
      });

      return hasChanges ? nextMap : prevMap;
    });
  }, [periodStart, periodEnd, timesheets, employees]);

  const approvedTimesheetsAll = timesheets.filter((t) => t.status === 'APPROVED');
  const approvedTimesheetsInPeriodCount = timesheets.filter((t) => {
    const clean = t.workDate ? t.workDate.split('T')[0] : '';
    return t.status === 'APPROVED' && clean >= periodStart && clean <= periodEnd;
  }).length;

  const approvedDatesSorted = approvedTimesheetsAll
    .map((t) => (t.workDate ? t.workDate.split('T')[0] : ''))
    .filter(Boolean)
    .sort();

  const earliestApprovedDate = approvedDatesSorted[0] || '';
  const latestApprovedDate = approvedDatesSorted[approvedDatesSorted.length - 1] || '';

  // Calculate live previews for the pending run
  const runStubsPreview = employees.filter(e => e.isActive).map(emp => {
    const hours = employeeHoursMap[emp.id] || { regular: 40, overtime: 0 };
    
    // Approved mileage & travel reimbursement in this period
    const empMileage = mileageLogs
      .filter(m => m.employeeId === emp.id && m.status === 'APPROVED' && !m.linkedPayStubId)
      .reduce((sum, m) => sum + m.mileageAllowance, 0);

    const empTravel = travelExpenses
      .filter(t => t.employeeId === emp.id && t.status === 'APPROVED' && !t.linkedPayStubId)
      .reduce((sum, t) => sum + t.amount, 0);

    const calc = calculateGrossToNet(emp, hours.regular, hours.overtime, empMileage, empTravel);

    return {
      employee: emp,
      hoursWorked: hours.regular,
      overtimeHours: hours.overtime,
      ...calc
    };
  });

  const activeStubsToSave = runStubsPreview.filter(
    (sp) => sp.hoursWorked > 0 || sp.overtimeHours > 0 || sp.grossEarnings > 0 || sp.totalReimbursements > 0
  );

  const totalRunGross = runStubsPreview.reduce((sum, s) => sum + s.grossEarnings, 0);
  const totalRunEmployeeTaxes = runStubsPreview.reduce((sum, s) => sum + s.totalEmployeeTaxes, 0);
  const totalRunReimbursements = runStubsPreview.reduce((sum, s) => sum + s.totalReimbursements, 0);
  const totalRunNet = runStubsPreview.reduce((sum, s) => sum + s.netPay, 0);
  const totalRunEmployerTaxes = runStubsPreview.reduce((sum, s) => sum + s.totalEmployerTaxes, 0);
  const totalRunCompanyCost = runStubsPreview.reduce((sum, s) => sum + s.totalCompanyCost, 0);

  const isFutureActiveYear = isFutureYear(activeTaxYear);
  const isPayPeriodFuture = isFutureDateString(periodEnd) || isFutureDateString(payDate);

  const handleExecuteRun = () => {
    if (activeStubsToSave.length === 0 || isFutureActiveYear || isPayPeriodFuture) {
      alert('No active earnings, hours, or reimbursements found for this period. At least one staff member must have hours or earnings to generate pay stubs.');
      return;
    }

    const stubsToSave: Omit<PayStub, 'id' | 'payrollRunId' | 'createdAt'>[] = activeStubsToSave.map(sp => ({
      employeeId: sp.employee.id,
      periodStart,
      periodEnd,
      payDate,
      hoursWorked: sp.hoursWorked,
      overtimeHours: sp.overtimeHours,
      hourlyRate: sp.employee.payRate,
      grossEarnings: sp.grossEarnings,
      federalIncomeTax: sp.federalIncomeTax,
      socialSecurityTax: sp.socialSecurityTax,
      medicareTax: sp.medicareTax,
      stateCode: sp.stateCode || sp.employee.state || 'PA',
      localityCode: sp.localityCode || sp.employee.localTaxJurisdictionCode,
      localityName: sp.localityName || sp.employee.localTaxJurisdictionName,
      stateIncomeTax: sp.stateIncomeTax ?? sp.paStateTax,
      localIncomeTax: sp.localIncomeTax ?? sp.paLocalEit,
      localFlatTax: sp.localFlatTax ?? sp.paLst,
      employerStateUnemployment: sp.employerStateUnemployment ?? sp.employerPaUc,
      taxBreakdown: sp.taxBreakdown,
      paStateTax: sp.paStateTax,
      paLocalEit: sp.paLocalEit,
      paLst: sp.paLst,
      totalEmployeeTaxes: sp.totalEmployeeTaxes,
      mileageReimbursement: sp.approvedMileageReimbursement,
      travelExpensesReimbursement: sp.approvedTravelReimbursement,
      totalReimbursements: sp.totalReimbursements,
      netPay: sp.netPay,
      employerSocialSecurity: sp.employerSocialSecurity,
      employerMedicare: sp.employerMedicare,
      employerPaUc: sp.employerPaUc,
      totalEmployerTaxes: sp.totalEmployerTaxes,
      totalCompanyCost: sp.totalCompanyCost,
      disbursementMethod: 'ACH',
      disbursementStatus: 'PENDING',
    }));

    onCreatePayrollRun(
      {
        periodStart,
        periodEnd,
        payDate,
        status: 'LOCKED',
        totalGross: totalRunGross,
        totalEmployeeTaxes: totalRunEmployeeTaxes,
        totalReimbursements: totalRunReimbursements,
        totalNetPay: totalRunNet,
        totalEmployerTaxes: totalRunEmployerTaxes,
        totalCompanyCost: totalRunCompanyCost,
        stubsCount: stubsToSave.length,
      },
      stubsToSave
    );

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setShowRunModal(false);
  };

  const copyAchInfo = (emp: Employee, amount: number, id: string) => {
    const info = `Bank: ${emp.bankName || 'N/A'} | ${emp.accountType || 'CHECKING'} | Routing: ${emp.routingNumber || 'N/A'} | Account: ${emp.accountNumber || 'N/A'} | Net: $${amount.toFixed(2)}`;
    navigator.clipboard.writeText(info);
    setCopiedAchId(id);
    setTimeout(() => setCopiedAchId(null), 2000);
  };

  // State for reference code inputs in disbursement matrix
  const [refInputs, setRefInputs] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      {/* Future Tax Year Warning Banner */}
      {isFutureActiveYear && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-medium flex items-center gap-3 shadow-sm">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold block text-sm">Future Tax Year Locked ({activeTaxYear})</span>
            <span>Running payroll or disbursing salaries for future tax years is disabled until tax year {activeTaxYear} begins.</span>
          </div>
        </div>
      )}

      {/* Top Banner & Run Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Zero-Cost Assisted Payroll Engine</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-medium">
              $0 SaaS Fees
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Computes exact PA 3.07% SIT, Local EIT by PSD code, and generates a one-click ACH Direct Deposit payout matrix with itemized pay stubs.
          </p>
        </div>

        <button
          id="run-payroll-btn"
          onClick={() => !isFutureActiveYear && setShowRunModal(true)}
          disabled={isFutureActiveYear}
          title={isFutureActiveYear ? `Running payroll for future tax year (${activeTaxYear}) is locked` : 'Run Pay Period'}
          className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
            isFutureActiveYear
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md shadow-emerald-700/20 cursor-pointer'
          }`}
        >
          {isFutureActiveYear ? <Lock className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 fill-white" />}
          <span>Run Pay Period</span>
        </button>
      </div>

      {/* ACH & Direct Deposit Bank Matrix */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">ACH Direct Deposit Payout Matrix</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Execute ACH transfers from your company bank account and record trace confirmation numbers</p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            Total Pending Payout: ${yearPayStubs.filter(s => s.disbursementStatus === 'PENDING').reduce((s, st) => s + st.netPay, 0).toFixed(2)}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">ACH Bank Account</th>
                  <th className="py-2.5 px-4 text-right">Gross Wages</th>
                  <th className="py-2.5 px-4 text-right">Taxes Withheld</th>
                  <th className="py-2.5 px-4 text-right">Reimbursements</th>
                  <th className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">Net ACH Pay</th>
                  <th className="py-2.5 px-4">ACH Trace Ref #</th>
                  <th className="py-2.5 px-4 text-center">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {yearPayStubs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      No pay stubs created yet. Click "Run Pay Period" above to compute and disburse your first payroll.
                    </td>
                  </tr>
                ) : (
                  yearPayStubs.slice(0, 6).map((stub) => {
                    const emp = employees.find(e => e.id === stub.employeeId);
                    if (!emp) return null;
                    const isPaid = stub.disbursementStatus === 'PAID';

                    return (
                      <tr key={stub.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {emp.firstName} {emp.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <span>
                              {emp.bankName ? `${emp.bankName} (${emp.accountType === 'SAVINGS' ? 'Sav' : 'Chk'} ${emp.bankAccountMasked || ''})` : 'ACH Pending'}
                            </span>
                            <button
                              onClick={() => copyAchInfo(emp, stub.netPay, stub.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                              title="Copy full ACH bank transfer details"
                            >
                              {copiedAchId === stub.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">${stub.grossEarnings.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">-${stub.totalEmployeeTaxes.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">+${stub.totalReimbursements.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ${stub.netPay.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          {isPaid ? (
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{stub.achTraceRef}</span>
                          ) : (
                            <input
                              type="text"
                              placeholder="e.g. ACH-948291"
                              value={refInputs[stub.id] || ''}
                              onChange={(e) => setRefInputs({ ...refInputs, [stub.id]: e.target.value })}
                              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white text-xs w-28 focus:outline-none focus:border-emerald-500"
                            />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Disbursed
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                const ref = refInputs[stub.id] || `ACH-${Math.floor(Math.random() * 899999 + 100000)}`;
                                onUpdateStubDisbursement(stub.id, ref);
                                confetti({ particleCount: 40, spread: 60 });
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white transition cursor-pointer shadow-xs"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Historical Payroll Runs & Stubs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Payroll Runs & Official Pay Stubs</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{yearPayrollRuns.length} completed run(s)</span>
        </div>

        {yearPayrollRuns.length === 0 ? (
          <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
            No payroll batches executed yet. Click "Run Pay Period" above to generate IRS and PA compliant pay stubs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {yearPayrollRuns.map((run) => (
              <div key={run.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Pay Period: {run.periodStart} to {run.periodEnd}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Pay Date: {run.payDate} • Status: {run.status}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${run.totalNetPay.toFixed(2)} Net
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Gross</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">${run.totalGross.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Taxes Withheld</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">-${run.totalEmployeeTaxes.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Company Cost</span>
                    <span className="font-mono font-bold text-amber-600 dark:amber-400">${run.totalCompanyCost.toFixed(2)}</span>
                  </div>
                </div>

                {/* Stubs inside this run */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">Employee Stubs in this batch:</span>
                  {yearPayStubs.filter(s => s.payrollRunId === run.id).map(stub => {
                    const emp = employees.find(e => e.id === stub.employeeId);
                    if (!emp) return null;
                    return (
                      <div key={stub.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/40 text-xs">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-200">{emp.firstName} {emp.lastName}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Net Take-Home: ${stub.netPay.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            id={`print-stub-btn-${stub.id}`}
                            onClick={() => printPayStubPdf(stub, emp, org)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Generate official PDF pay stub and open print dialog"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Print PDF</span>
                          </button>
                          <button
                            id={`save-stub-btn-${stub.id}`}
                            onClick={() => savePayStubPdf(stub, emp, org)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Download official PDF pay stub file"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Save PDF</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Run Pay Period */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowRunModal(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
            <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Execute Assisted Pay Period Run</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Automatic gross-to-net calculation with PA 3.07% and Accountable Plan reimbursements</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRunModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {approvedTimesheetsInPeriodCount > 0 ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Timesheets Auto-Sync Active:</strong> Pre-filled regular &amp; overtime hours from {approvedTimesheetsInPeriodCount} approved timesheet entries for this period ({periodStart} to {periodEnd}).
                </span>
              </div>
            ) : approvedTimesheetsAll.length > 0 ? (
              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>No Approved Timesheets for Period ({periodStart} to {periodEnd}):</strong> Found <strong>{approvedTimesheetsAll.length} approved timesheet entry(ies)</strong> for date range <strong>{earliestApprovedDate} to {latestApprovedDate}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (earliestApprovedDate && latestApprovedDate) {
                      setPeriodStart(earliestApprovedDate);
                      setPeriodEnd(latestApprovedDate);
                      setAutoFillFeedback({
                        type: 'success',
                        message: `Pay period dates synced to ${earliestApprovedDate} – ${latestApprovedDate} with approved timesheets.`
                      });
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-slate-900 dark:text-white font-medium text-[11px] whitespace-nowrap cursor-pointer transition shrink-0 shadow-xs"
                >
                  Sync Pay Period to {earliestApprovedDate} – {latestApprovedDate}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>No Approved Timesheets Found in System:</strong> Hours default to standard 40 hrs or can be entered manually below. Go to <strong>Timesheets</strong> tab to approve employee timesheets for auto-sync.
                </span>
              </div>
            )}

            {autoFillFeedback && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between transition ${
                autoFillFeedback.type === 'success'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                  : 'bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span>{autoFillFeedback.message}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setAutoFillFeedback(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Dates */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Period Start *</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Period End *</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pay Date *</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                </div>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
                <span>
                  Auto-detected from company setup for <strong className="text-slate-700 dark:text-slate-300">{calculatedPeriod.payFrequency.replace('_', '-')}</strong> schedule based on {
                    calculatedPeriod.source === 'LAST_RUN_ROLLOVER'
                      ? 'previous locked payroll run'
                      : calculatedPeriod.source === 'APPROVED_TIMESHEETS'
                      ? 'approved timesheet date range'
                      : 'calendar pay period'
                  }.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodStart(calculatedPeriod.periodStart);
                    setPeriodEnd(calculatedPeriod.periodEnd);
                    setPayDate(calculatedPeriod.payDate);
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                >
                  Reset to Auto-Suggested Dates
                </button>
              </div>
            </div>

            {/* Employee Hours & Live Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-300 block">Hours & Real-Time Calculation:</span>
                <button
                  type="button"
                  onClick={() => {
                    let targetStart = periodStart;
                    let targetEnd = periodEnd;

                    if (approvedTimesheetsInPeriodCount === 0 && approvedTimesheetsAll.length > 0 && earliestApprovedDate && latestApprovedDate) {
                      targetStart = earliestApprovedDate;
                      targetEnd = latestApprovedDate;
                      setPeriodStart(earliestApprovedDate);
                      setPeriodEnd(latestApprovedDate);
                    }

                    const updated: Record<string, { regular: number; overtime: number }> = {};
                    let loggedCount = 0;

                    employees.forEach((emp) => {
                      const h = getApprovedHoursForEmployee(timesheets, emp.id, targetStart, targetEnd);
                      updated[emp.id] = { regular: h.regular, overtime: h.overtime };
                      if (h.regular > 0 || h.overtime > 0) {
                        loggedCount++;
                      }
                    });
                    setEmployeeHoursMap(updated);

                    if (approvedTimesheetsAll.length > 0) {
                      setAutoFillFeedback({
                        type: 'success',
                        message: `Auto-filled hours for range ${targetStart} to ${targetEnd} (${loggedCount} staff with logged hours).`
                      });
                    } else {
                      setAutoFillFeedback({
                        type: 'info',
                        message: `No approved timesheets found in system. Please approve timesheets under Timesheets tab.`
                      });
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600/20 border border-indigo-500/30 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Auto-fill from Approved Timesheets
                </button>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Staff</th>
                      <th className="p-2.5 text-center">Regular Hrs</th>
                      <th className="p-2.5 text-center">OT Hrs</th>
                      <th className="p-2.5 text-right">Gross</th>
                      <th className="p-2.5 text-right">PA 3.07% + Fed</th>
                      <th className="p-2.5 text-right">Reimbursements</th>
                      <th className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {runStubsPreview.map(sp => (
                      <tr key={sp.employee.id}>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                          {sp.employee.firstName} {sp.employee.lastName}
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            ${sp.employee.payRate}/hr • PSD: {sp.employee.paPsdCode} • W-4: {sp.employee.w4FilingStatus ? sp.employee.w4FilingStatus.replace(/_/g, ' ') : 'SINGLE'}
                            {sp.employee.w4ExtraWithholding ? ` (+$${sp.employee.w4ExtraWithholding}/pay)` : ''}
                            {sp.isFicaExempt && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800 inline-block">
                                FICA & UC Exempt (Child &lt; 18)
                              </span>
                            )}
                            {sp.hoursWorked === 0 && sp.overtimeHours === 0 && sp.grossEarnings === 0 && sp.totalReimbursements === 0 && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700 inline-block">
                                Excluded (0 hrs / $0)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={employeeHoursMap[sp.employee.id]?.regular ?? 40}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                              setEmployeeHoursMap({
                                ...employeeHoursMap,
                                [sp.employee.id]: {
                                  regular: val,
                                  overtime: employeeHoursMap[sp.employee.id]?.overtime ?? 0
                                }
                              });
                            }}
                            className="w-14 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-center text-slate-900 dark:text-white font-mono"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={employeeHoursMap[sp.employee.id]?.overtime ?? 0}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                              setEmployeeHoursMap({
                                ...employeeHoursMap,
                                [sp.employee.id]: {
                                  regular: employeeHoursMap[sp.employee.id]?.regular ?? 40,
                                  overtime: val
                                }
                              });
                            }}
                            className="w-14 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-center text-slate-900 dark:text-white font-mono text-amber-600 dark:text-amber-400"
                          />
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">${sp.grossEarnings.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-rose-600 dark:text-rose-400">-${sp.totalEmployeeTaxes.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                          {sp.totalReimbursements > 0 ? `+$${sp.totalReimbursements.toFixed(2)}` : '$0.00'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ${sp.netPay.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Run Totals Summary Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Gross Wages</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200 text-sm">${totalRunGross.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Taxes Withheld</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">-${totalRunEmployeeTaxes.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Net Payout (ACH)</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">${totalRunNet.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRunModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRun}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white transition cursor-pointer shadow-md shadow-emerald-700/20"
              >
                Lock & Generate Pay Stubs
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
