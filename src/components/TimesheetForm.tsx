import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, User, FileText, AlertTriangle } from 'lucide-react';
import { Employee, TimesheetEntry } from '../types';
import { calculateTimesheetHours } from '../utils/timesheetUtils';
import { isFutureDateString } from '../utils/taxEngine';

export interface TimesheetFormProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newEntry: Omit<TimesheetEntry, 'id' | 'createdAt'>) => void;
}

/**
 * Form modal component for logging a new LLC staff or member timesheet entry.
 */
export function TimesheetForm({
  employees,
  isOpen,
  onClose,
  onSubmit,
}: TimesheetFormProps) {
  const activeEmployees = employees.filter((e) => e.isActive);

  const [employeeId, setEmployeeId] = useState('');
  const [workDate, setWorkDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('17:00');
  const [unpaidBreakMinutes, setUnpaidBreakMinutes] = useState(30);
  const [notes, setNotes] = useState('');

  // Sync selected employee ID whenever modal opens or active employees change
  useEffect(() => {
    if (isOpen && activeEmployees.length > 0) {
      if (!employeeId || !activeEmployees.some((e) => e.id === employeeId)) {
        setEmployeeId(activeEmployees[0].id);
      }
    }
  }, [isOpen, activeEmployees, employeeId]);

  if (!isOpen) return null;

  const isFutureWorkDate = isFutureDateString(workDate);

  const { totalNetHours, regularHours, overtimeHours } = calculateTimesheetHours(
    startTime,
    endTime,
    unpaidBreakMinutes
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = employeeId || activeEmployees[0]?.id;
    if (!targetEmpId || isFutureWorkDate) return;

    onSubmit({
      employeeId: targetEmpId,
      workDate,
      startTime,
      endTime,
      unpaidBreakMinutes,
      regularHours,
      overtimeHours,
      notes: notes.trim() || undefined,
      status: 'APPROVED', // Default to approved when entered by LLC manager
    });

    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-lg w-full flex">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Log Timesheet Entry</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {activeEmployees.length === 0 ? (
            <div className="p-6 space-y-4 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                No active LLC employees or staff found in your organization.
              </p>
              <p className="text-xs text-slate-500">
                Please add staff members under <strong>Settings &gt; Manage Employees</strong> before logging timesheets.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Select LLC Staff Member / Owner
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={employeeId || activeEmployees[0]?.id || ''}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {activeEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} (
                        {emp.employmentType === 'W2_SALARY' ? 'Salary' : 'Hourly'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Work Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                {isFutureWorkDate && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">
                    ⚠️ Future tax year dates are locked.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Unpaid Meal Break (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={unpaidBreakMinutes}
                  onChange={(e) => setUnpaidBreakMinutes(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Live Hours Summary Box */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Total Net: </span>
                  <strong className="text-slate-900 dark:text-white text-sm font-bold">{totalNetHours} hrs</strong>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Regular: </span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">{regularHours} hrs</strong>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Overtime: </span>
                  <strong className="text-amber-600 dark:text-amber-400 text-sm font-bold">{overtimeHours} hrs</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Work Description / Project Notes
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Client consultation & LLC operations"
                    rows={2}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFutureWorkDate}
                  className={`px-4 py-2 font-semibold rounded-lg shadow-lg transition ${
                    isFutureWorkDate
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
                  }`}
                >
                  Save Timesheet
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
