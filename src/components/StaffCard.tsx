import React from 'react';
import { Edit2, Trash2, CheckCircle2, XCircle, Mail, Phone, MapPin, Building, ShieldAlert, Award } from 'lucide-react';
import { Employee } from '../types';

interface StaffCardProps {
  key?: string;
  employee: Employee;
  isEditing: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

/**
 * Format employment type string into human-readable label.
 */
function getEmploymentTypeLabel(type: Employee['employmentType']): string {
  switch (type) {
    case 'W2_HOURLY':
      return 'W-2 Hourly';
    case 'W2_SALARY':
      return 'W-2 Salary';
    case '1099_CONTRACTOR':
      return '1099 Contractor';
    default:
      return type;
  }
}

/**
 * Format relationship to owner into badge text.
 */
function getRelationshipBadge(rel?: Employee['relationshipToOwner']): { label: string; color: string } | null {
  if (!rel || rel === 'NONE') return null;
  switch (rel) {
    case 'CHILD_UNDER_18':
      return { label: 'Child (<18) • FICA & UC Exempt', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    case 'CHILD_18_TO_20':
      return { label: 'Child (18–20) • UC Exempt', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    case 'SPOUSE':
      return { label: 'Spouse • UC Exempt', color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
    case 'PARENT':
      return { label: 'Parent • UC Exempt', color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
    default:
      return null;
  }
}

/**
 * Read-only summary card component for a staff member.
 */
export function StaffCard({
  employee,
  isEditing,
  onEdit,
  onToggleActive,
  onDelete,
  canDelete,
}: StaffCardProps) {
  const relBadge = getRelationshipBadge(employee.relationshipToOwner);

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 ${
        isEditing
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Header: Name, Status & Action Buttons */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {employee.firstName} {employee.lastName}
            </h4>
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                employee.isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {employee.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {getEmploymentTypeLabel(employee.employmentType)}
            </span>
            {relBadge && (
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${relBadge.color}`}>
                {relBadge.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {employee.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> {employee.email}
              </span>
            )}
            {employee.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {employee.phone}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1 cursor-pointer ${
              isEditing
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Editing' : 'Edit'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleActive}
            title={employee.isActive ? 'Deactivate staff' : 'Activate staff'}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
          >
            {employee.isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Remove employee"
              className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid: Rate & Tax Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-semibold block">Pay Rate</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
            ${employee.payRate}
            <span className="text-[10px] text-slate-500 font-normal">/{employee.employmentType === 'W2_SALARY' ? 'period' : 'hr'}</span>
          </span>
        </div>

        <div>
          <span className="text-slate-400 text-[10px] uppercase font-semibold block">PA Local PSD</span>
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate block" title={employee.paPsdName}>
            PSD {employee.paPsdCode} ({(employee.paResidentEitRate * 100).toFixed(2)}%)
          </span>
        </div>

        <div>
          <span className="text-slate-400 text-[10px] uppercase font-semibold block">Form W-4 Status</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {employee.w4FilingStatus || 'SINGLE'} {employee.w4MultipleJobs ? '(Step 2 Check)' : ''}
          </span>
        </div>

        <div>
          <span className="text-slate-400 text-[10px] uppercase font-semibold block">ACH Bank Account</span>
          <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">
            {employee.bankName ? `${employee.bankName} (${employee.accountType === 'SAVINGS' ? 'Savings' : 'Checking'} ${employee.bankAccountMasked || ''})` : 'ACH Not Setup'}
          </span>
        </div>
      </div>
    </div>
  );
}
