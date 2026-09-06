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
  Users
} from 'lucide-react';
import { Organization, TaxYear } from '../types';
import { isFutureYear } from '../utils/taxEngine';

export type NavigationTab = 
  | 'DASHBOARD'
  | 'EXPENSES'
  | 'MILEAGE'
  | 'TIMESHEETS'
  | 'STAFF'
  | 'PAYROLL'
  | 'COMPLIANCE'
  | 'TAX_RULES'
  | 'AUDIT_LOGS'
  | 'EXPORT'
  | 'SETTINGS'
  | 'MY_DOCUMENTS';

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
}

/**
 * Modern Sidebar Navigation for TaxShield Ledger supporting light/dark theme variants.
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
      ]
    },
    {
      category: 'Operations & Payroll',
      items: [
        { id: 'EXPENSES', label: 'Expenses & Receipts', icon: Receipt },
        { id: 'MILEAGE', label: 'Mileage & Travel', icon: Car },
        { id: 'STAFF', label: 'Staff & Onboarding', icon: Users },
        { id: 'TIMESHEETS', label: 'Timesheets Ledger', icon: Clock },
        { id: 'PAYROLL', label: 'Assisted Payroll Engine', icon: Calculator },
      ]
    },
    {
      category: 'Tax & Audit',
      items: [
        { id: 'COMPLIANCE', label: 'Compliance Calendar', icon: FileText },
        { id: 'TAX_RULES', label: 'Tax Rules Engine', icon: Scale },
        { id: 'AUDIT_LOGS', label: 'Audit Trail Inspector', icon: ShieldCheck },
      ]
    },
    {
      category: 'Administration',
      items: [
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
      ]
    }
  ];

  const navSections = isEmployee ? employeeNavSections : ownerNavSections;

  // Build unique year list from database taxYears state + activeTaxYear
  const yearNumbers = Array.from(new Set([
    activeTaxYear,
    ...taxYears.map(t => t.year)
  ])).sort((a, b) => b - a);

  return (
    <aside className={`fixed left-0 top-0 bottom-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-none">TaxShield</h1>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                LEDGER {org?.state ? org.state.trim().toUpperCase() : 'PA'} v1.0
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
              TS
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Tax Year Selector */}
      {!collapsed && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tax Year</span>
          <div className="flex items-center gap-1.5">
            <select
              value={activeTaxYear}
              onChange={(e) => onTaxYearChange(Number(e.target.value))}
              className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                className="p-1 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="p-3 space-y-4 flex-1 overflow-y-auto">
        {navSections.map((section, sIdx) => (
          <div key={section.category} className="space-y-1">
            {!collapsed ? (
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.category}
              </div>
            ) : (
              sIdx > 0 && <div className="my-2 border-t border-slate-200 dark:border-slate-800/80" />
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center px-0 py-2.5' : ''}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                  {item.id === 'COMPLIANCE' && pendingTaxCount > 0 && !collapsed && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-black rounded-md bg-amber-500 text-slate-950 shadow-xs animate-pulse">
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
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{org.name || 'Company Ledger'}</p>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">EIN: {org.ein || 'Unconfigured'}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-slate-400">
            <Building2 className="w-5 h-5" />
          </div>
        )}
      </div>
    </aside>
  );
}
