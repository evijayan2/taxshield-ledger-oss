import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Car, 
  Calculator, 
  FileText, 
  ShieldCheck, 
  Scale, 
  Download, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Building2,
  Plus,
  Clock,
  Users,
  Calendar,
  CalendarDays,
  User,
  CreditCard,
  Briefcase,
  ArrowRightLeft,
  X
} from 'lucide-react';
import { Organization, TaxYear } from '../types';
import { isFutureYear } from '../utils/taxEngine';

export type NavigationTab = 
  | 'DASHBOARD'
  | 'AUDIT_READINESS'
  | 'EXPENSES'
  | 'INVOICING'
  | 'RECONCILIATION'
  | 'MILEAGE'
  | 'TIMESHEETS'
  | 'PAYROLL_CALENDAR'
  | 'STAFF'
  | 'CONTRACTORS'
  | 'PAYROLL'
  | 'COMPLIANCE'
  | 'TAX_RULES'
  | 'TAX_COVERAGE'
  | 'ASSETS'
  | 'HOME_OFFICE'
  | 'TAX_SIMULATOR'
  | 'AUDIT_LOGS'
  | 'EXPORT'
  | 'SETTINGS'
  | 'MY_DOCUMENTS'
  | 'EMPLOYEE_REIMBURSEMENTS'
  | 'EMPLOYEE_PTO'
  | 'EMPLOYEE_PROFILE';

interface NavigationSidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  org: Organization;
  activeTaxYear: number;
  taxYears?: TaxYear[];
  onTaxYearChange: (year: number) => void;
  onOpenTaxYearSetup?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  pendingTaxCount?: number;
  isEmployee?: boolean;
  isReadOnly?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Modern Sidebar Navigation for TaxShield Ledger supporting dual-theme and full mobile drawer responsiveness.
 */
export function NavigationSidebar({
  activeTab,
  onSelectTab,
  org,
  activeTaxYear,
  taxYears = [],
  onTaxYearChange,
  onOpenTaxYearSetup,
  collapsed,
  onToggleCollapse,
  pendingTaxCount = 0,
  isEmployee = false,
  isReadOnly = false,
  mobileOpen = false,
  onCloseMobile,
}: NavigationSidebarProps) {
  const ownerNavSections: Array<{
    category: string;
    items: Array<{
      id: NavigationTab;
      label: string;
      icon: React.ElementType;
    }>;
  }> = [
    {
      category: 'Overview',
      items: [
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'AUDIT_READINESS', label: 'Audit Defense & Readiness', icon: ShieldCheck },
        { id: 'TAX_SIMULATOR', label: 'Tax Impact Simulator', icon: Calculator },
      ]
    },
    {
      category: 'Bookkeeping & Deductions',
      items: [
        { id: 'EXPENSES', label: 'Expenses & Receipts', icon: Receipt },
        { id: 'INVOICING', label: 'Invoices & Payments', icon: CreditCard },
        { id: 'RECONCILIATION', label: 'Bank Reconciliation', icon: ArrowRightLeft },
        { id: 'MILEAGE', label: 'Mileage & Travel', icon: Car },
        { id: 'ASSETS', label: 'Asset Depreciation', icon: Building2 },
        { id: 'HOME_OFFICE', label: 'Home Office Deduction', icon: Receipt },
      ]
    },
    {
      category: 'Workforce & Payroll',
      items: [
        { id: 'STAFF', label: 'Staff & Onboarding', icon: Users },
        { id: 'CONTRACTORS', label: 'Contractor 1099 Hub', icon: Briefcase },
        { id: 'TIMESHEETS', label: 'Timesheets Ledger', icon: Clock },
        { id: 'EMPLOYEE_PTO', label: 'PTO & Leave Approvals', icon: CalendarDays },
        { id: 'PAYROLL_CALENDAR', label: 'Payroll Calendar', icon: Calendar },
        { id: 'PAYROLL', label: 'Assisted Payroll Engine', icon: Calculator },
      ]
    },
    {
      category: 'Tax & Compliance',
      items: [
        { id: 'COMPLIANCE', label: 'Compliance Calendar', icon: FileText },
        { id: 'TAX_COVERAGE', label: 'Tax Rule Coverage', icon: ShieldCheck },
        { id: 'TAX_RULES', label: 'Tax Rules Engine', icon: Scale },
      ]
    },
    {
      category: 'Audit & Administration',
      items: [
        { id: 'AUDIT_LOGS', label: 'Audit Trail Inspector', icon: ShieldCheck },
        { id: 'EXPORT', label: 'Accountant Export', icon: Download },
        { id: 'SETTINGS', label: 'Company Profile & Setup', icon: Settings },
      ]
    }
  ];

  const employeeNavSections: Array<{
    category: string;
    items: Array<{
      id: NavigationTab;
      label: string;
      icon: React.ElementType;
    }>;
  }> = [
    {
      category: isReadOnly ? 'Employee Portal (Read-Only)' : 'Employee Portal',
      items: [
        { id: 'MY_DOCUMENTS', label: 'My Paystubs & W-2s', icon: FileText },
        { id: 'TIMESHEETS', label: isReadOnly ? 'My Timesheets (Read-Only)' : 'My Timesheets', icon: Clock },
        { id: 'EMPLOYEE_REIMBURSEMENTS', label: 'Expense & Mileage Claims', icon: Receipt },
        { id: 'EMPLOYEE_PTO', label: 'Time-Off & PTO Requests', icon: CalendarDays },
        { id: 'PAYROLL_CALENDAR', label: 'Payroll Calendar', icon: Calendar },
        { id: 'EMPLOYEE_PROFILE', label: 'My Profile & Direct Deposit', icon: User },
      ]
    }
  ];

  const navSections = isEmployee ? employeeNavSections : ownerNavSections;

  // Build unique year list from database taxYears state + activeTaxYear
  const yearNumbers = Array.from(new Set([
    activeTaxYear,
    ...taxYears.map(t => t.year)
  ])).sort((a, b) => b - a);

  const getItemAccent = (_id: NavigationTab, isActive: boolean) => {
    return { icon: isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200' };
  };

  const handleItemClick = (id: NavigationTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between w-72 max-w-[85vw] ${
        collapsed ? 'md:w-20' : 'md:w-64'
      } ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className={`items-center gap-3 ${collapsed ? 'flex md:hidden' : 'flex'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-900 dark:text-white font-bold shadow-md shadow-emerald-900/10 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-none truncate">TaxShield</h1>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              LEDGER {org?.state ? org.state.trim().toUpperCase() : 'PA'} v1.0
            </span>
          </div>
        </div>

        {collapsed && (
          <div className="hidden md:flex w-full justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-900 dark:text-white font-bold shadow-md">
              TS
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          {/* Desktop Collapse / Expand Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden md:block cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close X Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            title="Close navigation menu"
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tax Year Selector */}
      <div className={`px-4 py-3 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 items-center justify-between ${
        collapsed ? 'flex md:hidden' : 'flex'
      }`}>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tax Year</span>
        <div className="flex items-center gap-1.5">
          <select
            value={activeTaxYear}
            onChange={(e) => onTaxYearChange(Number(e.target.value))}
            className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
          >
            {yearNumbers.map(yr => (
              <option key={yr} value={yr}>
                {yr} {isFutureYear(yr) ? '🔒 (Locked)' : taxYears.some(t => t.year === yr) ? '✓' : ''}
              </option>
            ))}
          </select>
          {onOpenTaxYearSetup && (
            <button
              onClick={onOpenTaxYearSetup}
              title="Initialize or Edit Tax Year Setup"
              className="p-1 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-3 space-y-4 flex-1 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={section.category} className="space-y-1">
            <div className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 items-center justify-between ${
              collapsed ? 'flex md:hidden' : 'flex'
            }`}>
              <span>{section.category}</span>
            </div>
            {collapsed && sIdx > 0 && (
              <div className="hidden md:block my-2 border-t border-slate-200 dark:border-slate-800/80" />
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const accent = getItemAccent(item.id, isActive);
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-sm transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-start md:justify-center px-3.5 md:px-0 py-2 md:py-2.5' : ''}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${accent.icon}`} />
                  <span className={`flex-1 text-left truncate ${collapsed ? 'inline md:hidden' : 'inline'}`}>
                    {item.label}
                  </span>
                  {item.id === 'COMPLIANCE' && pendingTaxCount > 0 && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono font-black rounded-md bg-amber-500 text-slate-950 shadow-xs animate-pulse ${
                      collapsed ? 'inline md:hidden' : 'inline'
                    }`}>
                      DUE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer LLC Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
        <div className={`items-center gap-3 ${collapsed ? 'flex md:hidden' : 'flex'}`}>
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{org.name || 'Company Ledger'}</p>
            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">EIN: {org.ein || 'Unconfigured'}</p>
          </div>
        </div>

        {collapsed && (
          <div className="hidden md:flex justify-center text-slate-400">
            <Building2 className="w-5 h-5" />
          </div>
        )}
      </div>
    </aside>
  );
}
