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

export interface NavItemConfig {
  id: NavigationTab;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
}

export interface NavHubConfig {
  hubId: 'OVERVIEW' | 'BOOKKEEPING' | 'PAYROLL' | 'TAX_COMPLIANCE' | 'SETTINGS' | 'EMPLOYEE_PORTAL';
  category: string;
  items: NavItemConfig[];
}

export const OWNER_HUBS: NavHubConfig[] = [
  {
    hubId: 'OVERVIEW',
    category: 'Overview',
    items: [
      { id: 'DASHBOARD', label: 'Dashboard', shortLabel: 'Overview', icon: LayoutDashboard },
      { id: 'AUDIT_READINESS', label: 'Audit Defense & Readiness', shortLabel: 'Audit Score', icon: ShieldCheck },
      { id: 'TAX_SIMULATOR', label: 'Tax Impact Simulator', shortLabel: 'Simulator', icon: Calculator },
    ]
  },
  {
    hubId: 'BOOKKEEPING',
    category: 'Bookkeeping',
    items: [
      { id: 'EXPENSES', label: 'Expenses & Receipts', shortLabel: 'Expenses', icon: Receipt },
      { id: 'INVOICING', label: 'Invoices & Payments', shortLabel: 'Invoices', icon: CreditCard },
      { id: 'RECONCILIATION', label: 'Bank Reconciliation', shortLabel: 'Recon', icon: ArrowRightLeft },
      { id: 'MILEAGE', label: 'Mileage & Travel', shortLabel: 'Mileage', icon: Car },
      { id: 'ASSETS', label: 'Asset Depreciation', shortLabel: 'Depreciation', icon: Building2 },
      { id: 'HOME_OFFICE', label: 'Home Office Deduction', shortLabel: 'Home Office', icon: Receipt },
    ]
  },
  {
    hubId: 'PAYROLL',
    category: 'Workforce & Payroll',
    items: [
      { id: 'PAYROLL', label: 'Assisted Payroll Engine', shortLabel: 'Run Payroll', icon: Calculator },
      { id: 'STAFF', label: 'Staff & Onboarding', shortLabel: 'Staff', icon: Users },
      { id: 'CONTRACTORS', label: 'Contractor 1099 Hub', shortLabel: '1099 Hub', icon: Briefcase },
      { id: 'TIMESHEETS', label: 'Timesheets Ledger', shortLabel: 'Timesheets', icon: Clock },
      { id: 'EMPLOYEE_PTO', label: 'PTO & Leave Approvals', shortLabel: 'PTO & Leave', icon: CalendarDays },
      { id: 'PAYROLL_CALENDAR', label: 'Payroll Calendar', shortLabel: 'Calendar', icon: Calendar },
    ]
  },
  {
    hubId: 'TAX_COMPLIANCE',
    category: 'Tax & Compliance',
    items: [
      { id: 'COMPLIANCE', label: 'Compliance Calendar', shortLabel: 'Compliance', icon: FileText },
      { id: 'TAX_COVERAGE', label: 'Tax Rule Coverage', shortLabel: 'Rule Coverage', icon: ShieldCheck },
      { id: 'TAX_RULES', label: 'Tax Rules Engine', shortLabel: 'Rule Engine', icon: Scale },
      { id: 'EXPORT', label: 'Accountant Export', shortLabel: 'Export', icon: Download },
      { id: 'AUDIT_LOGS', label: 'Audit Trail Inspector', shortLabel: 'Audit Trail', icon: ShieldCheck },
    ]
  },
  {
    hubId: 'SETTINGS',
    category: 'Settings',
    items: [
      { id: 'SETTINGS', label: 'Company Profile & Setup', shortLabel: 'Company Profile', icon: Settings },
    ]
  }
];

export const EMPLOYEE_HUBS: NavHubConfig[] = [
  {
    hubId: 'EMPLOYEE_PORTAL',
    category: 'Employee Portal',
    items: [
      { id: 'MY_DOCUMENTS', label: 'My Paystubs & W-2s', shortLabel: 'Paystubs & W-2s', icon: FileText },
      { id: 'TIMESHEETS', label: 'My Timesheets', shortLabel: 'Timesheets', icon: Clock },
      { id: 'EMPLOYEE_REIMBURSEMENTS', label: 'Expense & Mileage Claims', shortLabel: 'Claims', icon: Receipt },
      { id: 'EMPLOYEE_PTO', label: 'Time-Off & PTO Requests', shortLabel: 'Time Off', icon: CalendarDays },
      { id: 'PAYROLL_CALENDAR', label: 'Payroll Calendar', shortLabel: 'Calendar', icon: Calendar },
      { id: 'EMPLOYEE_PROFILE', label: 'My Profile & Direct Deposit', shortLabel: 'Profile', icon: User },
    ]
  }
];

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
  const navSections = isEmployee
    ? [
        {
          ...EMPLOYEE_HUBS[0],
          category: isReadOnly ? 'Employee Portal (Read-Only)' : 'Employee Portal',
          items: EMPLOYEE_HUBS[0].items.map((item) => ({
            ...item,
            label: isReadOnly && item.id === 'TIMESHEETS' ? 'My Timesheets (Read-Only)' : item.label,
          })),
        },
      ]
    : OWNER_HUBS;

  // Build unique year list from database taxYears state + activeTaxYear
  const yearNumbers = Array.from(new Set([
    activeTaxYear,
    ...taxYears.map(t => t.year)
  ])).sort((a, b) => b - a);

  const getItemAccent = (_id: NavigationTab, isActive: boolean) => {
    return { 
      icon: isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200' 
    };
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/10 shrink-0">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md">
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
            className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden cursor-pointer"
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
              className="p-1.5 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md cursor-pointer transition-colors shadow-2xs"
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
                  className={`w-full min-h-[42px] flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-sm transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
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
