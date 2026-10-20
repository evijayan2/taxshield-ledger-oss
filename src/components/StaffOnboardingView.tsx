import React from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  FileCheck2, 
  Building2, 
  Clock, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Employee, Organization } from '../types';
import { StaffManagementSection } from './StaffManagementSection';

interface StaffOnboardingViewProps {
  employees: Employee[];
  org?: Organization;
  onSaveEmployees: (employees: Employee[]) => void;
  onNavigateToTimesheets?: () => void;
  onNavigateToPayroll?: () => void;
}

/**
 * Dedicated Staff Onboarding & Roster Management Module for TaxShield Ledger.
 * Provides a clean interface for onboarding W-2 employees and 1099 contractors,
 * configuring IRS W-4 withholdings, state/local tax codes, and managing staff status.
 */
export function StaffOnboardingView({
  employees,
  org,
  onSaveEmployees,
  onNavigateToTimesheets,
  onNavigateToPayroll,
}: StaffOnboardingViewProps) {
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const activeEmployees = safeEmployees.filter((e) => e.isActive);
  const w2Employees = safeEmployees.filter((e) => e.employmentType !== '1099_CONTRACTOR');
  const contractors = safeEmployees.filter((e) => e.employmentType === '1099_CONTRACTOR');
  
  // Calculate W-4 completion / PA PSD configuration status
  const fullyConfiguredCount = safeEmployees.filter(
    (e) => Boolean(e.ssnLastFour) && Boolean(e.paPsdCode) && Boolean(e.w4FilingStatus)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Human Resources & Tax Compliance
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Staff Onboarding & W-4 Tax Roster
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
            Onboard staff, configure Form W-4 federal withholdings, set PA local PSD tax rates, and manage 1099 contractor classifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToTimesheets && (
            <button
              onClick={onNavigateToTimesheets}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold rounded-xl transition text-xs cursor-pointer shadow-2xs"
            >
              <Clock className="w-4 h-4 text-slate-500" /> Log Timesheets
            </button>
          )}
          {onNavigateToPayroll && (
            <button
              onClick={onNavigateToPayroll}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition text-xs cursor-pointer"
            >
              <DollarSign className="w-4 h-4" /> Run Payroll Engine
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Staff Roster</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">{safeEmployees.length}</p>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{activeEmployees.length} currently active</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>W-2 Employees</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">{w2Employees.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">FICA & State/Local tax tracking</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>1099 Contractors</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-mono">{contractors.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Form 1099-NEC ready</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Tax Compliance Ready</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {fullyConfiguredCount} / {safeEmployees.length}
          </p>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-600 h-1.5 rounded-full transition-all"
              style={{ width: `${safeEmployees.length > 0 ? (fullyConfiguredCount / safeEmployees.length) * 100 : 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Compliance Information Box */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3 text-slate-700 dark:text-slate-300 text-xs leading-relaxed shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 dark:text-white font-bold block text-sm mb-0.5">
            PA Employer Onboarding Compliance Standard:
          </strong>
          All Pennsylvania employers must obtain a completed IRS Form W-4, PA Form REV-1667 (Employee's Nonwithholding Application Certificate if applicable), and PA Residency Certification Form (with 6-digit Political Subdivision / PSD Code) prior to issuing the first paycheck.
        </div>
      </div>

      {/* Main Staff Management Section Component */}
      <StaffManagementSection
        employees={safeEmployees}
        org={org}
        companyState={org?.state || 'DE'}
        onSaveEmployees={onSaveEmployees}
      />
    </div>
  );
}
