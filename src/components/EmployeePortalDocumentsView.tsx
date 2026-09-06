import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  User 
} from 'lucide-react';
import { Employee, Organization, PayStub } from '../types';
import { AuthUser } from '../context/AuthContext';
import { PayStubModal } from './PayStubModal';
import { calculateW2Summaries, formatCurrency } from '../utils/w2w3Data';
import { generateW2Pdf, downloadPdfDocument } from '../utils/w2w3PdfBuilder';

export interface EmployeePortalDocumentsViewProps {
  user: AuthUser | null;
  employee: Employee | null;
  org: Organization;
  payStubs: PayStub[];
  activeTaxYear?: number;
  isReadOnly?: boolean;
}

/**
 * Dedicated Employee Portal Documents View.
 * Allows employees (both active and inactive/deactivated) to review and download
 * their official itemized pay stubs, payment history, and IRS Form W-2 wage statements.
 */
export function EmployeePortalDocumentsView({
  user,
  employee,
  org,
  payStubs = [],
  activeTaxYear = 2026,
  isReadOnly = false,
}: EmployeePortalDocumentsViewProps) {
  const [selectedStub, setSelectedStub] = useState<PayStub | null>(null);

  // Filter paystubs for this employee
  const employeeStubs = payStubs.filter(
    (s) => s.employeeId === employee?.id || (employee?.email && employee.email.toLowerCase() === user?.email.toLowerCase())
  ).sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime());

  // Calculate W-2 summary for this employee if employee record exists and pay stubs have been issued
  const hasIssuedW2 = Boolean(employee && employeeStubs.length > 0);
  const w2Summaries = hasIssuedW2 && employee ? calculateW2Summaries(org, [employee], employeeStubs) : [];
  const currentW2 = w2Summaries[0] || null;

  const totalGross = employeeStubs.reduce((sum, s) => sum + (s.grossEarnings || 0), 0);
  const totalNet = employeeStubs.reduce((sum, s) => sum + (s.netPay || 0), 0);
  const totalTaxes = employeeStubs.reduce((sum, s) => sum + (s.totalEmployeeTaxes || 0), 0);

  const handleDownloadW2 = () => {
    if (!currentW2) return;
    const doc = generateW2Pdf(currentW2, org);
    downloadPdfDocument(
      doc,
      `Form_W2_${currentW2.employeeLastName || 'Employee'}_${(org.name || 'Company').replace(/\s+/g, '_')}_${activeTaxYear}.pdf`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Inactive Read-Only Warning Banner */}
      {isReadOnly && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs shadow-sm flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-sm block text-amber-950 dark:text-amber-100">
              Employee Account in Read-Only Mode
            </span>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              Your staff account is currently inactive. You have full, permanent access to view, download, and print your historical payroll statements, paystubs, and IRS Form W-2 tax documents. Timesheet entry and write access are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <User className="w-4 h-4" /> Employee Portal & Payroll Documents
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {employee ? `${employee.firstName} ${employee.lastName}` : (user?.displayName || user?.email || 'My Account')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Official payroll records, itemized pay stubs, and IRS Form W-2 tax documentation for {org.name || 'Company'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasIssuedW2 && currentW2 && (
            <button
              onClick={handleDownloadW2}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition text-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Form W-2 ({activeTaxYear})</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
            <span>YTD Gross Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-2">{formatCurrency(totalGross)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{employeeStubs.length} Pay Stub(s) Issued</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
            <span>YTD Total Taxes Withheld</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-2">{formatCurrency(totalTaxes)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Federal + PA State & Local EIT</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
            <span>YTD Net Pay Received</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-2">{formatCurrency(totalNet)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Direct Deposit / ACH Transferred</p>
        </div>
      </div>

      {/* Tax Documentation Section (Form W-2 Summary) */}
      {hasIssuedW2 && currentW2 ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                IRS Form W-2 Wage & Tax Summary ({activeTaxYear})
              </h3>
            </div>
            <button
              onClick={handleDownloadW2}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download Official W-2 PDF
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Box 1 • Federal Wages</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{formatCurrency(currentW2.boxes.box1Wages)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Box 2 • Fed Income Tax</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{formatCurrency(currentW2.boxes.box2FedTax)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Box 16 • State Wages</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{formatCurrency(currentW2.boxes.box16StateWages)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Box 17 • State Tax</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">{formatCurrency(currentW2.boxes.box17StateTax)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              IRS Form W-2 Wage & Tax Summary ({activeTaxYear})
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 dark:text-slate-400">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No Form W-2 Issued Yet
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              Official IRS Form W-2 statements are generated automatically once payroll runs are processed and wages are disbursed for this tax year.
            </p>
          </div>
        </div>
      )}

      {/* Itemized Pay Stubs Ledger Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Itemized Pay Statements & Stubs
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">
            {employeeStubs.length} Record(s)
          </span>
        </div>

        {employeeStubs.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">No pay stubs issued yet.</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              When payroll is processed by your company owner, your itemized pay statements will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Pay Date</th>
                  <th className="pb-3">Pay Period</th>
                  <th className="pb-3 text-right">Hours</th>
                  <th className="pb-3 text-right">Gross Pay</th>
                  <th className="pb-3 text-right">Taxes Withheld</th>
                  <th className="pb-3 text-right">Reimbursements</th>
                  <th className="pb-3 text-right">Net Pay</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employeeStubs.map((stub) => (
                  <tr key={stub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 pl-2 font-bold text-slate-900 dark:text-white font-mono">
                      {stub.payDate}
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">
                      {stub.periodStart} – {stub.periodEnd}
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {(stub.hoursWorked || 0) + (stub.overtimeHours || 0)} hrs
                    </td>
                    <td className="py-3.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(stub.grossEarnings)}
                    </td>
                    <td className="py-3.5 text-right font-mono text-rose-600 dark:text-rose-400">
                      -{formatCurrency(stub.totalEmployeeTaxes)}
                    </td>
                    <td className="py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(stub.totalReimbursements || 0)}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                      {formatCurrency(stub.netPay)}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {stub.disbursementStatus || 'PAID'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => setSelectedStub(stub)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paystub Modal */}
      {selectedStub && employee && (
        <PayStubModal
          stub={selectedStub}
          employee={employee}
          org={org}
          onClose={() => setSelectedStub(null)}
        />
      )}
    </div>
  );
}

