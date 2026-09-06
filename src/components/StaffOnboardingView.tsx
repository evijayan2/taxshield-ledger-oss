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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <UserPlus className="w-4 h-4" /> Human Resources & Tax Compliance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Staff Onboarding & W-4 Tax Roster
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Onboard staff, configure Form W-4 federal withholdings, set PA local PSD tax rates, and manage 1099 contractor classifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToTimesheets && (
            <button
              onClick={onNavigateToTimesheets}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium rounded-xl transition text-xs cursor-pointer"
            >
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Log Timesheets
            </button>
          )}
          {onNavigateToPayroll && (
            <button
              onClick={onNavigateToPayroll}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/30 transition text-xs cursor-pointer"
            >
              <DollarSign className="w-4 h-4" /> Run Payroll Engine
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Staff Roster</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{safeEmployees.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{activeEmployees.length} currently active</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
            <span>W-2 Employees</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{w2Employees.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">FICA & State/Local tax tracking</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
            <span>1099 Contractors</span>
            <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{contractors.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Form 1099-NEC ready</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
            <span>Tax Compliance Ready</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {fullyConfiguredCount} / {safeEmployees.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">W-4 & PSD Code Verified</p>
        </div>
      </div>

      {/* Compliance Information Box */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 flex items-start gap-3 text-emerald-900 dark:text-emerald-200/90 text-xs leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-emerald-950 dark:text-emerald-300 font-semibold block mb-0.5">
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
