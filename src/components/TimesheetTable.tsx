import React, { useState } from 'react';
import { Trash2, CheckCircle, XCircle, Clock, CheckSquare, Square } from 'lucide-react';
import { Employee, TimesheetEntry, TimesheetStatus } from '../types';
import { formatHours } from '../utils/timesheetUtils';

export interface TimesheetTableProps {
  timesheets: TimesheetEntry[];
  employees: Employee[];
  selectedEmployeeId: string;
  selectedStatus: string;
  onStatusChange: (id: string, status: TimesheetStatus) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

/**
 * Renders table list of timesheet entries with theme support, bulk checkbox selection, and action controls.
 */
export function TimesheetTable({
  timesheets = [],
  employees = [],
  selectedEmployeeId,
  selectedStatus,
  onStatusChange,
  onDelete,
  isReadOnly = false,
}: TimesheetTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const empMap = new Map(safeEmployees.map((e) => [e.id, e]));

  const filtered = safeTimesheets.filter((t) => {
    if (!t) return false;
    const matchEmp = selectedEmployeeId === 'ALL' || t.employeeId === selectedEmployeeId;
    const matchStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchEmp && matchStatus;
  });

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((t) => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (status: TimesheetStatus) => {
    selectedIds.forEach((id) => onStatusChange(id, status));
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => onDelete(id));
    setSelectedIds([]);
  };

  if (filtered.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
        <Clock className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
        <p className="font-medium text-slate-800 dark:text-slate-300">No timesheet entries found</p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
          Adjust your filters or click "Log Timesheet Entry" / "Bulk Range" to create records.
        </p>
      </div>
    );
  }

  const renderBadge = (status: TimesheetStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'SUBMITTED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Clock className="w-3 h-3" /> Submitted
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Bulk Action Controls */}
      {selectedIds.length > 0 && !isReadOnly && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200">
            {selectedIds.length} {selectedIds.length === 1 ? 'entry' : 'entries'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('APPROVED')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Bulk Approve
            </button>
            <button
              onClick={() => handleBulkStatusChange('REJECTED')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <XCircle className="w-3.5 h-3.5" /> Bulk Reject
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-800 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950/80 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 w-10 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                  title="Select All"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3">Work Date</th>
              <th className="px-4 py-3">Staff / Member</th>
              <th className="px-4 py-3">Shift Hours</th>
              <th className="px-4 py-3 text-right">Regular</th>
              <th className="px-4 py-3 text-right">Overtime</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {filtered.map((entry) => {
              const emp = empMap.get(entry.employeeId);
              const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
              const isSelected = selectedIds.includes(entry.id);

              return (
                <tr
                  key={entry.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                    isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleSelectRow(entry.id)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    {entry.workDate}
                  </td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
                    {empName}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {entry.startTime} – {entry.endTime} ({entry.unpaidBreakMinutes}m break)
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-mono">
                    {formatHours(entry.regularHours)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap font-mono">
                    {entry.overtimeHours > 0 ? formatHours(entry.overtimeHours) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {entry.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {renderBadge(entry.status)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {isReadOnly ? (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">—</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        {entry.status !== 'APPROVED' && (
                          <button
                            onClick={() => onStatusChange(entry.id, 'APPROVED')}
                            title="Approve Timesheet"
                            className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {entry.status !== 'REJECTED' && (
                          <button
                            onClick={() => onStatusChange(entry.id, 'REJECTED')}
                            title="Reject Timesheet"
                            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(entry.id)}
                          title="Delete Entry"
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
