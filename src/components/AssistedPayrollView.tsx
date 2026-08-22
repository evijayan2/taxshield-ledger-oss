import React, { useState } from 'react';
import { 
  Calculator, 
  Play, 
  CheckCircle2, 
  Send, 
  FileText, 
  Copy, 
  Check, 
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Employee, Organization, PayrollRun, PayStub, MileageLog, TravelExpense } from '../types';
import { calculateGrossToNet } from '../utils/taxEngine';
import { PayStubModal } from './PayStubModal';

interface AssistedPayrollViewProps {
  employees: Employee[];
  org: Organization;
  payrollRuns: PayrollRun[];
  payStubs: PayStub[];
  mileageLogs: MileageLog[];
  travelExpenses: TravelExpense[];
  onCreatePayrollRun: (
    runData: Omit<PayrollRun, 'id' | 'createdAt'>,
    stubsData: Omit<PayStub, 'id' | 'payrollRunId' | 'createdAt'>[]
  ) => void;
  onUpdateStubDisbursement: (stubId: string, zelleRef: string) => void;
}

export function AssistedPayrollView({
  employees,
  org,
  payrollRuns,
  payStubs,
  mileageLogs,
  travelExpenses,
  onCreatePayrollRun,
  onUpdateStubDisbursement
}: AssistedPayrollViewProps) {
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedStubForView, setSelectedStubForView] = useState<{ stub: PayStub; emp: Employee } | null>(null);
  const [copiedZelleId, setCopiedZelleId] = useState<string | null>(null);

  // New Payroll Run Form
  const [periodStart, setPeriodStart] = useState('2026-08-01');
  const [periodEnd, setPeriodEnd] = useState('2026-08-15');
  const [payDate, setPayDate] = useState('2026-08-20');

  // Map employee hours for current run
  const [employeeHoursMap, setEmployeeHoursMap] = useState<Record<string, { regular: number; overtime: number }>>(() => {
    const initial: Record<string, { regular: number; overtime: number }> = {};
    employees.forEach(emp => {
      initial[emp.id] = { regular: 40, overtime: 0 };
    });
    return initial;
  });

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

  const totalRunGross = runStubsPreview.reduce((sum, s) => sum + s.grossEarnings, 0);
  const totalRunEmployeeTaxes = runStubsPreview.reduce((sum, s) => sum + s.totalEmployeeTaxes, 0);
  const totalRunReimbursements = runStubsPreview.reduce((sum, s) => sum + s.totalReimbursements, 0);
  const totalRunNet = runStubsPreview.reduce((sum, s) => sum + s.netPay, 0);
  const totalRunEmployerTaxes = runStubsPreview.reduce((sum, s) => sum + s.totalEmployerTaxes, 0);
  const totalRunCompanyCost = runStubsPreview.reduce((sum, s) => sum + s.totalCompanyCost, 0);

  const handleExecuteRun = () => {
    const stubsToSave: Omit<PayStub, 'id' | 'payrollRunId' | 'createdAt'>[] = runStubsPreview.map(sp => ({
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
      disbursementMethod: 'ZELLE',
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

  const copyZelleInfo = (handle: string, amount: number, id: string) => {
    navigator.clipboard.writeText(`${handle} | $${amount.toFixed(2)}`);
    setCopiedZelleId(id);
    setTimeout(() => setCopiedZelleId(null), 2000);
  };

  // State for reference code inputs in disbursement matrix
  const [refInputs, setRefInputs] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
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
            Computes exact PA 3.07% SIT, Local EIT by PSD code, and generates a one-click Zelle payout matrix with itemized pay stubs.
          </p>
        </div>

        <button
          id="run-payroll-btn"
          onClick={() => setShowRunModal(true)}
          className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition flex items-center gap-2 shadow-md shadow-emerald-700/20 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Run Pay Period</span>
        </button>
      </div>

      {/* Zelle & Manual Bank Transfer Matrix */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Zelle Payout Matrix (Latest Pay Stubs)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Execute transfers from your LLC bank account and record confirmation codes</p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            Total Pending Payout: ${payStubs.filter(s => s.disbursementStatus === 'PENDING').reduce((s, st) => s + st.netPay, 0).toFixed(2)}
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Zelle Handle</th>
                  <th className="py-2.5 px-4 text-right">Gross Wages</th>
                  <th className="py-2.5 px-4 text-right">Taxes Withheld</th>
                  <th className="py-2.5 px-4 text-right">Reimbursements</th>
                  <th className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">Net Zelle Pay</th>
                  <th className="py-2.5 px-4">Confirmation Ref #</th>
                  <th className="py-2.5 px-4 text-center">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {payStubs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                      No pay stubs created yet. Click "Run Pay Period" above to compute and disburse your first payroll.
                    </td>
                  </tr>
                ) : (
                  payStubs.slice(0, 6).map((stub) => {
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
                            <span>{emp.zelleHandle}</span>
                            <button
                              onClick={() => copyZelleInfo(emp.zelleHandle, stub.netPay, stub.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                              title="Copy Zelle handle and amount"
                            >
                              {copiedZelleId === stub.id ? (
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
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{stub.zelleConfirmationRef}</span>
                          ) : (
                            <input
                              type="text"
                              placeholder="e.g. ZEL-948291"
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
                                const ref = refInputs[stub.id] || `ZEL-${Math.floor(Math.random() * 899999 + 100000)}`;
                                onUpdateStubDisbursement(stub.id, ref);
                                confetti({ particleCount: 40, spread: 60 });
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs"
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
          <span className="text-xs text-slate-500 dark:text-slate-400">{payrollRuns.length} completed run(s)</span>
        </div>

        {payrollRuns.length === 0 ? (
          <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs">
            No payroll batches executed yet. Click "Run Pay Period" above to generate IRS and PA compliant pay stubs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payrollRuns.map((run) => (
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
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">LLC Total Cost</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">${run.totalCompanyCost.toFixed(2)}</span>
                  </div>
                </div>

                {/* Stubs inside this run */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">Employee Stubs in this batch:</span>
                  {payStubs.filter(s => s.payrollRunId === run.id).map(stub => {
                    const emp = employees.find(e => e.id === stub.employeeId);
                    if (!emp) return null;
                    return (
                      <div key={stub.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/40 text-xs">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-200">{emp.firstName} {emp.lastName}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">Net Take-Home: ${stub.netPay.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => setSelectedStubForView({ stub, emp })}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>View Stub</span>
                        </button>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh] text-xs">
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

            {/* Dates */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Period Start *</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Period End *</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Pay Date *</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Employee Hours & Live Preview Table */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-800 dark:text-slate-300 block">Hours & Real-Time Calculation:</span>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Staff</th>
                      <th className="p-2.5 text-center">Regular Hours</th>
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
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">${sp.employee.payRate}/hr • PSD: {sp.employee.paPsdCode}</span>
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={employeeHoursMap[sp.employee.id]?.regular || 40}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEmployeeHoursMap({
                                ...employeeHoursMap,
                                [sp.employee.id]: {
                                  ...employeeHoursMap[sp.employee.id],
                                  regular: val
                                }
                              });
                            }}
                            className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-center text-slate-900 dark:text-white font-mono"
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Net Payout (Zelle)</span>
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
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-md shadow-emerald-700/20"
              >
                Lock & Generate Pay Stubs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Stub Modal */}
      {selectedStubForView && (
        <PayStubModal
          stub={selectedStubForView.stub}
          employee={selectedStubForView.emp}
          org={org}
          onClose={() => setSelectedStubForView(null)}
        />
      )}
    </div>
  );
}
