import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  TrendingUp,
  Briefcase,
  Users,
  Layers,
  Calculator,
  Lock
} from 'lucide-react';
import { Employee, TimesheetEntry, TimesheetStatus, PayrollCalendarPeriod } from '../types';
import { TimesheetTable } from './TimesheetTable';
import { TimesheetForm } from './TimesheetForm';
import { BulkTimesheetForm } from './BulkTimesheetForm';
import { formatHours } from '../utils/timesheetUtils';
import { getRecordYear, isFutureYear } from '../utils/taxEngine';
import { isTimesheetModificationAllowed } from 'taxshield-ledger-core';

export interface TimesheetsViewProps {
  timesheets?: TimesheetEntry[];
  employees?: Employee[];
  activeTaxYear?: number;
  calendarPeriods?: PayrollCalendarPeriod[];
  isReadOnly?: boolean;
  onAddTimesheet: (newEntry: Omit<TimesheetEntry, 'id' | 'createdAt'>) => void;
  onBulkAddTimesheets?: (entries: Omit<TimesheetEntry, 'id' | 'createdAt'>[]) => void;
  onUpdateTimesheetStatus: (id: string, status: TimesheetStatus) => void;
  onDeleteTimesheet: (id: string) => void;
  onNavigateToPayroll?: () => void;
}

/**
 * Main Timesheet Management View component for tracking, approving, and auditing LLC staff and member hours.
 * Supports theme switching (Light/Dark mode), bulk range timesheet generation, and inactive read-only enforcement.
 */
export function TimesheetsView({
  timesheets = [],
  employees = [],
  activeTaxYear = 2026,
  calendarPeriods = [],
  isReadOnly = false,
  onAddTimesheet,
  onBulkAddTimesheets,
  onUpdateTimesheetStatus,
  onDeleteTimesheet,
  onNavigateToPayroll,
}: TimesheetsViewProps) {
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const isFutureActiveYear = isFutureYear(activeTaxYear);
  const yearTimesheets = safeTimesheets.filter((t) => getRecordYear(t.workDate) === activeTaxYear);

  // KPI Calculations
  const approvedEntries = yearTimesheets.filter((t) => t?.status === 'APPROVED');
  const pendingEntries = yearTimesheets.filter((t) => t?.status === 'SUBMITTED');

  const totalApprovedRegular = approvedEntries.reduce((sum, t) => sum + (t.regularHours || 0), 0);
  const totalApprovedOvertime = approvedEntries.reduce((sum, t) => sum + (t.overtimeHours || 0), 0);
  const totalHoursLogged = yearTimesheets.reduce((sum, t) => sum + (t.regularHours || 0) + (t.overtimeHours || 0), 0);

  const handleBulkSubmit = (entries: Omit<TimesheetEntry, 'id' | 'createdAt'>[]) => {
    if (isFutureActiveYear) return;
    if (onBulkAddTimesheets) {
      onBulkAddTimesheets(entries);
    } else {
      entries.forEach((e) => onAddTimesheet(e));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Future Tax Year Warning Banner */}
      {isFutureActiveYear && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-medium flex items-center gap-3 shadow-sm">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold block text-sm">Future Tax Year Locked ({activeTaxYear})</span>
            <span>Logging or bulk importing timesheets for future tax years is disabled until tax year {activeTaxYear} begins.</span>
          </div>
        </div>
      )}

      {/* Inactive Read-Only Warning Banner */}
      {isReadOnly && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs shadow-sm flex items-start gap-3.5">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-sm block text-amber-950 dark:text-amber-100">
              Timesheet Logging Disabled (Read-Only Account)
            </span>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              Your staff account is currently inactive. You can review and inspect your historical attendance records below, but new timesheet submissions and modifications are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Labor & Attendance Compliance
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Staff & Member Timesheet Ledger
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            Track daily work hours for staff employees and active working members for labor compliance and payroll accuracy.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (onNavigateToPayroll) {
                  onNavigateToPayroll();
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition text-xs cursor-pointer"
            >
              <Calculator className="w-4 h-4" /> Run Paycheck
            </button>
            <button
              onClick={() => !isFutureActiveYear && setIsBulkModalOpen(true)}
              disabled={isFutureActiveYear}
              title={isFutureActiveYear ? `Bulk logging timesheets for future tax year (${activeTaxYear}) is locked` : 'Bulk Log Range'}
              className={`flex items-center justify-center gap-2 px-4 py-2 border font-semibold rounded-xl transition text-xs cursor-pointer shadow-2xs ${
                isFutureActiveYear
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4 text-slate-500" /> Bulk Log Range
            </button>
            <button
              onClick={() => !isFutureActiveYear && setIsSingleModalOpen(true)}
              disabled={isFutureActiveYear}
              title={isFutureActiveYear ? `Logging timesheets for future tax year (${activeTaxYear}) is locked` : 'Log Single Entry'}
              className={`flex items-center justify-center gap-2 px-4 py-2 font-bold rounded-xl transition text-xs shadow-xs ${
                isFutureActiveYear
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer'
              }`}
            >
              {isFutureActiveYear ? <Lock className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4" />}
              Log Single Entry
            </button>
          </div>
        )}
      </div>

      {/* LLC & FLSA Regulatory Callout Banner */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3 text-slate-700 dark:text-slate-300 text-xs leading-relaxed shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 dark:text-white font-bold block text-sm mb-0.5">
            Labor & FLSA Compliance Note:
          </strong>
          Maintain consistent daily timesheet records for all hourly W-2 staff and active team members. Under Fair Labor Standards Act (FLSA) regulations, non-exempt hourly employees must be paid 1.5x overtime for hours worked over 40 per workweek.
        </div>
      </div>

      {safeEmployees.length === 0 && (
        <div className="bg-amber-50 dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 p-4 rounded-xl flex items-center justify-between gap-4 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>No staff members found. Add employees under the <strong>Staff &amp; Onboarding</strong> module menu to start logging timesheets.</span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-xs hover:border-indigo-500/30 transition-all">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Logged Hours</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{formatHours(totalHoursLogged)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{safeTimesheets.length} total entries</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-xs hover:border-emerald-500/30 transition-all">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Approved Regular Hours</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{formatHours(totalApprovedRegular)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ready for payroll runs</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-xs hover:border-amber-500/30 transition-all">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Approved Overtime</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">{formatHours(totalApprovedOvertime)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily &gt; 8 hrs calculation</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-xs hover:border-rose-500/30 transition-all">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Pending Approvals</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">{pendingEntries.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Entries awaiting review</p>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Filter Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Staff & Members</option>
              {safeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Filter Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="SUBMITTED">Submitted / Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Showing {yearTimesheets.length} record(s)
        </span>
      </div>

      {/* Timesheet Data Table */}
      <TimesheetTable
        timesheets={yearTimesheets}
        employees={safeEmployees}
        selectedEmployeeId={selectedEmployeeId}
        selectedStatus={selectedStatus}
        calendarPeriods={calendarPeriods}
        onStatusChange={onUpdateTimesheetStatus}
        onDelete={onDeleteTimesheet}
        isReadOnly={isReadOnly}
      />

      {/* Single Entry Modal Form */}
      <TimesheetForm
        employees={safeEmployees}
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        onSubmit={onAddTimesheet}
      />

      {/* Bulk Range Modal Form */}
      <BulkTimesheetForm
        employees={safeEmployees}
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onBulkSubmit={handleBulkSubmit}
      />
    </div>
  );
}
