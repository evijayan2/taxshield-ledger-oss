import React from 'react';
import { 
  Printer, 
  Download,
  Building2, 
  User, 
  FileText, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { PayStub, Employee, Organization } from '../types';
import { printPayStubPdf, savePayStubPdf } from '../utils/payStubPdfBuilder';

interface PayStubModalProps {
  stub: PayStub;
  employee: Employee;
  org: Organization;
  onClose: () => void;
}

export function PayStubModal({ stub, employee, org, onClose }: PayStubModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300 print:hidden"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-3xl w-full flex">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-6 text-slate-800 dark:text-slate-200">
        
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Official Itemized Pay Stub</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              PA & IRS Compliant
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-stub-btn"
              onClick={() => printPayStubPdf(stub, employee, org)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Generate PDF pay stub and open print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
            <button
              id="save-stub-btn"
              onClick={() => savePayStubPdf(stub, employee, org)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download official PDF pay stub file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Pay Stub Document Container */}
        <div id="printable-pay-stub" className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300 print:bg-white print:text-black print:border-none print:p-0">
          
          {/* Header & Company Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white print:text-black tracking-tight">{org.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{org.address}, {org.city}, {org.state} {org.zip}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                <span>Federal EIN: <strong className="text-slate-800 dark:text-slate-200 print:text-black">{org.ein}</strong></span>
                <span>•</span>
                <span>PA Tax ID: <strong className="text-slate-800 dark:text-slate-200 print:text-black">{org.stateTaxId}</strong></span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-6 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                Earnings Statement
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-xs pt-1">Pay Date: <strong className="text-slate-900 dark:text-white print:text-black font-semibold">{stub.payDate}</strong></p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Period: {stub.periodStart} to {stub.periodEnd}</p>
            </div>
          </div>

          {/* Employee & Tax Withholding Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Employee Information</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white print:text-black">{employee.firstName} {employee.lastName}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">SSN: •••-••-{employee.ssnLastFour} | Type: {employee.employmentType.replace('_', ' ')}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Disbursement: Direct Deposit ({stub.disbursementMethod || 'ACH'}) — {employee.bankName ? `${employee.bankName} (${employee.accountType === 'SAVINGS' ? 'Savings' : 'Checking'} ${employee.bankAccountMasked || ''})` : 'ACH Account'}
              </p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tax Classification</span>
              <p className="text-slate-800 dark:text-slate-200 text-xs">W-4 Status: {employee.w4FilingStatus.replace(/_/g, ' ')}</p>
              {employee.relationshipToOwner && employee.relationshipToOwner !== 'NONE' && (
                <p className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                  Owner Relation: {
                    employee.relationshipToOwner === 'CHILD_UNDER_18' ? 'Child (Under 18) • IRC §3121(b)(3) FICA Exempt' :
                    employee.relationshipToOwner === 'CHILD_18_TO_20' ? 'Child (18–20) • PA UC Exempt' :
                    employee.relationshipToOwner === 'SPOUSE' ? 'Spouse • PA UC Exempt' :
                    'Parent • PA UC Exempt'
                  }
                </p>
              )}
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">PA Resident PSD: <strong className="text-slate-800 dark:text-slate-200">{employee.paPsdCode}</strong> ({employee.paPsdName})</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">PA EIT Resident: {(employee.paResidentEitRate * 100).toFixed(2)}% | Work PSD: {(employee.paWorkEitRate * 100).toFixed(2)}%</p>
            </div>
          </div>

          {/* Earnings & Hours */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Earnings & Hours</h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Earnings Type</th>
                    <th className="p-2.5 text-right">Hours</th>
                    <th className="p-2.5 text-right">Hourly Rate</th>
                    <th className="p-2.5 text-right">Total Gross</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-2.5 text-slate-900 dark:text-white font-medium">Regular Base Wages</td>
                    <td className="p-2.5 text-right font-mono">{stub.hoursWorked.toFixed(2)}</td>
                    <td className="p-2.5 text-right font-mono">${stub.hourlyRate.toFixed(2)}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">${stub.grossEarnings.toFixed(2)}</td>
                  </tr>
                  {stub.overtimeHours > 0 && (
                    <tr>
                      <td className="p-2.5 text-slate-900 dark:text-white font-medium">Overtime (1.5x)</td>
                      <td className="p-2.5 text-right font-mono">{stub.overtimeHours.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono">${(stub.hourlyRate * 1.5).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${(stub.overtimeHours * stub.hourlyRate * 1.5).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Taxes & Withholdings Breakout */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Statutory Tax Deductions (Employee)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
                <span className="text-slate-500 dark:text-slate-400">Federal Income Tax</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">${stub.federalIncomeTax.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
                <span className="text-slate-500 dark:text-slate-400">Social Security (6.2%)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">${stub.socialSecurityTax.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
                <span className="text-slate-500 dark:text-slate-400">Medicare (1.45%)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">${stub.medicareTax.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
                <span className="text-slate-500 dark:text-slate-400">PA State Tax (3.07%)</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${stub.paStateTax.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
                <span className="text-slate-500 dark:text-slate-400">PA Local EIT</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">${stub.paLocalEit.toFixed(2)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xs">
                <span className="text-slate-500 dark:text-slate-400">PA Local LST</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">${stub.paLst.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Total Statutory Taxes Withheld:</span>
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">-${stub.totalEmployeeTaxes.toFixed(2)}</span>
            </div>
          </div>

          {/* Accountable Plan Non-Taxable Reimbursements */}
          {stub.totalReimbursements > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accountable Plan Reimbursements (Non-Taxable Additions)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {stub.mileageReimbursement > 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300">IRS 5-Point Mileage Reimbursement</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">+${stub.mileageReimbursement.toFixed(2)}</span>
                  </div>
                )}
                {stub.travelExpensesReimbursement > 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300">Travel Expenses (Tolls & Parking)</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">+${stub.travelExpensesReimbursement.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Net Take-Home Pay Summary Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Net Take-Home Pay (Disbursed via ACH Direct Deposit)</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Formula: (Gross ${stub.grossEarnings.toFixed(2)} - Taxes ${stub.totalEmployeeTaxes.toFixed(2)}) + Reimbursements ${stub.totalReimbursements.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">${stub.netPay.toFixed(2)}</span>
              {stub.achTraceRef && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">ACH Trace Ref: {stub.achTraceRef}</p>
              )}
            </div>
          </div>

          {/* Employer Tax Contributions (Informational) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap justify-between gap-2">
            <span>Employer Match: FICA SS ${stub.employerSocialSecurity.toFixed(2)} | Medicare ${stub.employerMedicare.toFixed(2)} | PA UC ${stub.employerPaUc.toFixed(2)}</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Total LLC Cost for Employee: ${stub.totalCompanyCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition cursor-pointer"
          >
            Close Stub
          </button>
        </div>
      </div>
    </div>
  </div>
);
}
