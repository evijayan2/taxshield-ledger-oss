import React, { useState, Suspense } from 'react';
import { 
  Database, 
  UserCheck, 
  LogOut, 
  Building2,
  Menu
} from 'lucide-react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { AuthGate } from './components/AuthGate';
import { LLCOnboardingModal } from './components/LLCOnboardingModal';
import { TaxYearSetupModal } from './components/TaxYearSetupModal';
import { NavigationSidebar, NavigationTab } from './components/NavigationSidebar';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { FontSizeControl } from './components/FontSizeControl';
import { FontSizeProvider } from './context/FontSizeContext';
import { DatabaseOfflineBanner } from './components/DatabaseOfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { isOrgConfigured } from './utils/storage';
import { useAppState } from './hooks/useAppState';
import { getTaskTaxYear, isFutureYear, isFutureDateString } from './utils/taxEngine';
import { resolve1099NecThreshold } from 'taxshield-ledger-core';
import { PublicW9OnboardingView } from './components/contractors/PublicW9OnboardingView';
import { PayrollRun, PayStub, Employee, FormW9Record } from './types';

// Lazy-loaded tab views for optimized bundle size and fast initial load
const DashboardOverviewView = React.lazy(() =>
  import('./components/DashboardOverviewView').then(m => ({ default: m.DashboardOverviewView }))
);
const ExpenseTrackerView = React.lazy(() =>
  import('./components/ExpenseTrackerView').then(m => ({ default: m.ExpenseTrackerView }))
);
const MileageAndTravelView = React.lazy(() =>
  import('./components/MileageAndTravelView').then(m => ({ default: m.MileageAndTravelView }))
);
const TimesheetsView = React.lazy(() =>
  import('./components/TimesheetsView').then(m => ({ default: m.TimesheetsView }))
);
const StaffOnboardingView = React.lazy(() =>
  import('./components/StaffOnboardingView').then(m => ({ default: m.StaffOnboardingView }))
);
const AssistedPayrollView = React.lazy(() =>
  import('./components/AssistedPayrollView').then(m => ({ default: m.AssistedPayrollView }))
);
const ComplianceFilingsView = React.lazy(() =>
  import('./components/ComplianceFilingsView').then(m => ({ default: m.ComplianceFilingsView }))
);
const TaxRuleAdminView = React.lazy(() =>
  import('./components/TaxRuleAdminView').then(m => ({ default: m.TaxRuleAdminView }))
);
const AuditTrailView = React.lazy(() =>
  import('./components/AuditTrailView').then(m => ({ default: m.AuditTrailView }))
);
const YearEndExportView = React.lazy(() =>
  import('./components/YearEndExportView').then(m => ({ default: m.YearEndExportView }))
);
const SettingsView = React.lazy(() =>
  import('./components/SettingsView').then(m => ({ default: m.SettingsView }))
);
const EmployeePortalDocumentsView = React.lazy(() =>
  import('./components/EmployeePortalDocumentsView').then(m => ({ default: m.EmployeePortalDocumentsView }))
);
const PayrollCalendarView = React.lazy(() =>
  import('./components/PayrollCalendarView').then(m => ({ default: m.PayrollCalendarView }))
);
const TaxRuleCoverageMatrixView = React.lazy(() =>
  import('./components/TaxRuleCoverageMatrixView').then(m => ({ default: m.TaxRuleCoverageMatrixView }))
);
const AssetDepreciationView = React.lazy(() =>
  import('./components/AssetDepreciationView').then(m => ({ default: m.AssetDepreciationView }))
);
const HomeOfficeView = React.lazy(() =>
  import('./components/HomeOfficeView').then(m => ({ default: m.HomeOfficeView }))
);
const TaxImpactSimulatorView = React.lazy(() =>
  import('./components/TaxImpactSimulatorView').then(m => ({ default: m.TaxImpactSimulatorView }))
);
const EmployeeReimbursementsView = React.lazy(() =>
  import('./components/EmployeeReimbursementsView').then(m => ({ default: m.EmployeeReimbursementsView }))
);
const EmployeePtoView = React.lazy(() =>
  import('./components/EmployeePtoView').then(m => ({ default: m.EmployeePtoView }))
);
const EmployeeProfileView = React.lazy(() =>
  import('./components/EmployeeProfileView').then(m => ({ default: m.EmployeeProfileView }))
);
const InvoicingView = React.lazy(() =>
  import('./components/invoicing/InvoicingView').then(m => ({ default: m.InvoicingView }))
);
const Contractor1099HubView = React.lazy(() =>
  import('./components/contractors/Contractor1099HubView').then(m => ({ default: m.Contractor1099HubView }))
);
const ReconciliationView = React.lazy(() =>
  import('./components/reconciliation/ReconciliationView').then(m => ({ default: m.ReconciliationView }))
);
const AuditReadinessDashboardView = React.lazy(() =>
  import('./components/audit/AuditReadinessDashboardView').then(m => ({ default: m.AuditReadinessDashboardView }))
);

function ViewLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="glass-panel p-6 rounded-2xl h-28 flex items-center justify-between" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl h-32" />
        <div className="glass-card p-6 rounded-2xl h-32" />
        <div className="glass-card p-6 rounded-2xl h-32" />
      </div>
      <div className="glass-panel p-6 rounded-2xl h-64" />
    </div>
  );
}

function MainAppContent({ state }: { state: ReturnType<typeof useAppState> }) {
  const {
    data,
    setData,
    dbStatus,
    dbError,
    retryDatabaseConnection,
    isInitialLoading,
    handleAddGeneralExpense,
    handleDeleteGeneralExpense,
    handleAddMileage,
    handleDeleteMileage,
    handleAddTravelExpense,
    handleDeleteTravelExpense,
    handleAddTimesheet,
    handleBulkAddTimesheets,
    handleUpdateTimesheetStatus,
    handleDeleteTimesheet,
    handleSetTaxYear,
    handleCreateTaxYear,
    handleSaveOrg,
    handleCreateInvoice,
    handleCreateCustomer,
    handleUpdateInvoiceStatus,
    handleDeleteInvoice,
  } = state;

  const { user, membership, isOwner, isEmployee, isReadOnly, employeeProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => (isEmployee ? 'MY_DOCUMENTS' : 'DASHBOARD'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTaxYearModal, setShowTaxYearModal] = useState(false);
  
  const displayUserEmail = user?.email || data?.company?.ownerEmail || data?.org?.ownerEmail || 'User';

  // Match linked employee profile from ledger state
  const currentEmployee = data.employees?.find((e) => 
    (user?.email && e.email && e.email.toLowerCase() === user.email.toLowerCase()) ||
    (employeeProfile?.id && e.id === employeeProfile.id)
  ) || null;

  const isConfigured = isOrgConfigured(data.org);
  // Prompt for company setup automatically when no company is configured and initial data fetch is finished
  const shouldShowOnboardingModal = showOnboarding || (!isConfigured && !isInitialLoading && dbStatus?.connected && isOwner);

  const isDbOffline = !isInitialLoading && Boolean(dbStatus && !dbStatus.connected);
  const currentActiveTaxYear = data.activeTaxYear || 2026;

  React.useEffect(() => {
    const compName = data?.company?.name || data?.org?.name;
    if (compName) {
      document.title = `${compName} | TaxShield Ledger`;
    } else {
      document.title = 'TaxShield Ledger - Micro-LLC Tax & Payroll';
    }
  }, [data?.company?.name, data?.org?.name]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Database Offline Service Banner */}
      {isDbOffline && (
        <DatabaseOfflineBanner
          dbStatus={dbStatus}
          errorMessage={dbError}
          onRetry={retryDatabaseConnection}
        />
      )}

      {/* Sidebar Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <NavigationSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileSidebarOpen(false);
        }}
        org={data.org}
        activeTaxYear={currentActiveTaxYear}
        taxYears={data.taxYears}
        onTaxYearChange={handleSetTaxYear}
        onOpenTaxYearSetup={() => setShowTaxYearModal(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        pendingTaxCount={(data.complianceTasks || []).filter(t => getTaskTaxYear(t) === currentActiveTaxYear && t.status !== 'FILED').length}
        isEmployee={isEmployee}
        isReadOnly={isReadOnly}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 min-w-0 ml-0 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              title="Open navigation menu"
              className="p-1.5 sm:p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 min-w-0">
              <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[110px] sm:max-w-[200px] md:max-w-xs">
                {data?.company?.name || data?.org?.name || 'Micro-LLC Setup Pending'}
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
              <span className="hidden sm:inline text-indigo-600 dark:text-indigo-300 font-bold shrink-0">
                TY {currentActiveTaxYear}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Theme Switcher Toggle */}
            <ThemeSwitcher />

            {/* Font Size Selector Control */}
            <FontSizeControl />

            {/* Postgres Connection Status */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <Database className={`w-3.5 h-3.5 ${dbStatus?.connected ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`} />
              <span className={dbStatus?.connected ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                {dbStatus?.connected ? 'Postgres' : 'Offline'}
              </span>
            </div>

            {/* User Profile / Logout */}
            <div className="flex items-center gap-1.5 sm:gap-3 border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <UserCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span className="hidden xl:inline truncate max-w-[120px]" title={user?.email || 'Logged In User'}>
                  {displayUserEmail}
                </span>
              </div>
              <button
                onClick={signOut}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Onboarding Banner if not configured */}
        {!isConfigured && !isInitialLoading && (
          <div className="mx-3 sm:mx-6 mt-4 sm:mt-6 p-4 rounded-2xl bg-emerald-950/90 dark:bg-slate-900 border border-emerald-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">LLC & Tax Year Configuration Required</h4>
                <p className="text-xs text-slate-300">Set up your Pennsylvania LLC EIN, owner classification, and active Tax Year to start automated payroll & filings.</p>
              </div>
            </div>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all shrink-0"
            >
              Configure LLC & Tax Year
            </button>
          </div>
        )}

        {/* Dynamic Content Views with Suspense */}
        <main className="p-3 sm:p-4 md:p-6 overflow-x-hidden min-w-0">
          <ErrorBoundary>
            <Suspense fallback={<ViewLoadingSkeleton />}>
            {activeTab === 'DASHBOARD' && (
              <DashboardOverviewView data={data} onNavigateTab={setActiveTab} />
            )}

            {activeTab === 'AUDIT_READINESS' && (
              <AuditReadinessDashboardView
                data={data}
                onNavigateTab={setActiveTab}
                onDeleteExpense={handleDeleteGeneralExpense}
                onDeleteTravelExpense={handleDeleteTravelExpense}
              />
            )}

            {activeTab === 'EXPENSES' && (
              <ExpenseTrackerView
                expenses={data.generalExpenses}
                activeTaxYear={currentActiveTaxYear}
                onAddExpense={handleAddGeneralExpense}
                onDeleteExpense={handleDeleteGeneralExpense}
              />
            )}

            {activeTab === 'INVOICING' && (
              <InvoicingView
                invoices={data.invoices || []}
                customers={data.customers || []}
                company={{
                  name: data.company?.name || data.org?.name || 'My Micro-LLC',
                  ein: data.company?.ein || data.org?.ein || '',
                  address: data.company?.address || data.org?.address || '',
                  city: data.company?.city || data.org?.city || '',
                  state: data.company?.state || data.org?.state || 'PA',
                  zip: data.company?.zip || data.org?.zip || '',
                  ownerEmail: data.company?.ownerEmail || data.org?.ownerEmail,
                }}
                activeTaxYear={currentActiveTaxYear}
                onCreateInvoice={handleCreateInvoice}
                onCreateCustomer={handleCreateCustomer}
                onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                onDeleteInvoice={handleDeleteInvoice}
              />
            )}

            {activeTab === 'RECONCILIATION' && (
              <ReconciliationView
                companyId={data.company?.id || data.org?.id || 'comp_main'}
                activeTaxYear={currentActiveTaxYear}
                generalExpenses={data.generalExpenses || []}
                travelExpenses={data.travelExpenses || []}
                invoices={data.invoices || []}
                payrollRuns={data.payrollRuns || []}
                contractorPayments={data.contractorPayments || []}
                bankBatches={data.bankBatches || []}
                bankTransactions={data.bankTransactions || []}
                onImportBatch={(batch, transactions) => {
                  setData((prev) => ({
                    ...prev,
                    bankBatches: [batch, ...(prev.bankBatches || [])],
                    bankTransactions: [...transactions, ...(prev.bankTransactions || [])],
                  }));
                }}
                onUpdateTransaction={(updatedTx) => {
                  setData((prev) => ({
                    ...prev,
                    bankTransactions: (prev.bankTransactions || []).map((t) =>
                      t.id === updatedTx.id ? updatedTx : t
                    ),
                  }));
                }}
                onCreateExpenseFromBankTx={(bankTxId, newExpense) => {
                  handleAddGeneralExpense(newExpense);
                }}
              />
            )}

            {activeTab === 'MILEAGE' && (
              <MileageAndTravelView
                employees={data.employees}
                mileageLogs={data.mileageLogs}
                travelExpenses={data.travelExpenses}
                org={data.org}
                activeTaxYear={currentActiveTaxYear}
                onAddMileage={handleAddMileage}
                onDeleteMileage={handleDeleteMileage}
                onAddTravelExpense={handleAddTravelExpense}
                onDeleteTravelExpense={handleDeleteTravelExpense}
              />
            )}

            {activeTab === 'MY_DOCUMENTS' && (
              <EmployeePortalDocumentsView
                user={user}
                employee={currentEmployee}
                org={data.org}
                payStubs={data.payStubs || []}
                activeTaxYear={currentActiveTaxYear}
                isReadOnly={isReadOnly}
              />
            )}

            {activeTab === 'EMPLOYEE_REIMBURSEMENTS' && (
              <EmployeeReimbursementsView
                user={user}
                employee={currentEmployee}
                expenses={data.generalExpenses}
                mileageLogs={data.mileageLogs}
                activeTaxYear={currentActiveTaxYear}
                isReadOnly={isReadOnly}
                onAddExpense={handleAddGeneralExpense}
                onAddMileage={handleAddMileage}
              />
            )}

            {activeTab === 'EMPLOYEE_PTO' && (
              <EmployeePtoView
                user={user}
                employee={currentEmployee}
                activeTaxYear={currentActiveTaxYear}
                isOwner={isOwner}
                isReadOnly={isReadOnly}
              />
            )}

            {activeTab === 'EMPLOYEE_PROFILE' && (
              <EmployeeProfileView
                user={user}
                employee={currentEmployee}
                org={data.org}
                isReadOnly={isReadOnly}
                onSaveProfile={(updatedProfile) => {
                  setData((prev) => ({
                    ...prev,
                    employees: (prev.employees || []).map((e) =>
                      e.id === updatedProfile.id || (e.email && updatedProfile.email && e.email.toLowerCase() === updatedProfile.email.toLowerCase())
                        ? { ...e, ...updatedProfile }
                        : e
                    ),
                  }));
                }}
              />
            )}

            {activeTab === 'TIMESHEETS' && (
              <TimesheetsView
                timesheets={data.timesheets}
                employees={data.employees}
                activeTaxYear={currentActiveTaxYear}
                calendarPeriods={data.calendarPeriods}
                isReadOnly={isReadOnly}
                onAddTimesheet={handleAddTimesheet}
                onBulkAddTimesheets={handleBulkAddTimesheets}
                onUpdateTimesheetStatus={handleUpdateTimesheetStatus}
                onDeleteTimesheet={handleDeleteTimesheet}
                onNavigateToPayroll={() => setActiveTab('PAYROLL')}
              />
            )}

            {activeTab === 'PAYROLL_CALENDAR' && (
              <PayrollCalendarView
                company={data.company || data.org}
                activeTaxYear={currentActiveTaxYear}
                taxYears={data.taxYears}
                calendarPeriods={data.calendarPeriods}
                payScheduleConfigs={data.payScheduleConfigs}
                isOwner={isOwner}
                onPublishCalendar={(year, periods, config) => {
                  setData((prev) => ({
                    ...prev,
                    company: prev.company ? { ...prev.company, payFrequency: config.payFrequency } : prev.company,
                    org: prev.org ? { ...prev.org, payFrequency: config.payFrequency } : prev.org,
                    calendarPeriods: [
                      ...(prev.calendarPeriods || []).filter((p) => !p.periodStart.startsWith(String(year))),
                      ...periods,
                    ],
                    payScheduleConfigs: [
                      ...(prev.payScheduleConfigs || []).filter((c) => c.taxYearId !== `ty_${year}`),
                      config,
                    ],
                  }));
                }}
                onUpdateScheduleConfig={(config) => {
                  setData((prev) => ({
                    ...prev,
                    company: prev.company ? { ...prev.company, payFrequency: config.payFrequency } : prev.company,
                    org: prev.org ? { ...prev.org, payFrequency: config.payFrequency } : prev.org,
                    payScheduleConfigs: [
                      ...(prev.payScheduleConfigs || []).filter((c) => c.taxYearId !== config.taxYearId),
                      config,
                    ],
                  }));
                }}
              />
            )}

            {activeTab === 'STAFF' && (
              <StaffOnboardingView
                employees={data.employees}
                org={data.org}
                onSaveEmployees={(newEmployees) => setData(prev => ({ ...prev, employees: newEmployees }))}
                onNavigateToTimesheets={() => setActiveTab('TIMESHEETS')}
                onNavigateToPayroll={() => setActiveTab('PAYROLL')}
              />
            )}

            {activeTab === 'CONTRACTORS' && (
              <Contractor1099HubView
                contractors={(data.employees || [])
                  .filter((e) => e.employmentType === '1099_CONTRACTOR')
                  .map((e) => ({
                    id: e.id,
                    name: `${e.firstName} ${e.lastName}`,
                    email: e.email,
                    phone: e.phone,
                    workerClassification: '1099_CONTRACTOR',
                    w9Record: (data.w9Records || []).find((w) => w.employeeId === e.id) || null,
                    payments: (data.contractorPayments || []).filter((p) => p.employeeId === e.id),
                  }))}
                payerProfile={{
                  name: data.company?.name || data.org?.name || 'Company',
                  tin: data.company?.ein || data.org?.ein || '',
                  address: data.company?.address || data.org?.address || '',
                  city: data.company?.city || data.org?.city || '',
                  state: data.company?.state || data.org?.state || 'PA',
                  zip: data.company?.zip || data.org?.zip || '',
                }}
                activeTaxYear={currentActiveTaxYear}
                statutoryThreshold={resolve1099NecThreshold()}
                onRecordPayment={(payment) => {
                  setData((prev) => ({
                    ...prev,
                    contractorPayments: [...(prev.contractorPayments || []), payment],
                    generalExpenses: payment.generalExpenseId ? [
                      ...prev.generalExpenses,
                      {
                        id: payment.generalExpenseId,
                        expenseDate: payment.paymentDate,
                        payee: 'Contractor Payment',
                        category: 'OTHER',
                        amount: payment.amount,
                        paidBy: 'LLC_ACCOUNT',
                        description: payment.description || 'Nonemployee compensation',
                        isTaxDeductible: true,
                        createdAt: new Date().toISOString(),
                      }
                    ] : prev.generalExpenses,
                  }));
                }}
                onInviteGenerated={(contractorId, tokenHash) => {
                  // Structured audit/console tracking
                  void tokenHash;
                  void contractorId;
                }}
                onAddContractor={(newC) => {
                  const newId = `contractor_${Date.now()}`;
                  const newEmp: Employee = {
                    id: newId,
                    firstName: newC.firstName,
                    lastName: newC.lastName,
                    email: newC.email,
                    phone: newC.phone || '',
                    ssnLastFour: '',
                    employmentType: '1099_CONTRACTOR',
                    payRate: 0,
                    payFrequency: (data.company?.payFrequency || data.org?.payFrequency || 'BI_WEEKLY') as any,
                    w4FilingStatus: 'SINGLE',
                    w4MultipleJobs: false,
                    w4DependentCredit: 0,
                    w4OtherIncome: 0,
                    w4Deductions: 0,
                    w4ExtraWithholding: 0,
                    isActive: true,
                  };
                  const newW9Record: FormW9Record | null = newC.businessName ? {
                    id: `w9_${newId}`,
                    companyId: data.company?.id || data.org?.id || 'comp_main',
                    employeeId: newId,
                    businessName: newC.businessName,
                    taxClassification: 'INDIVIDUAL_SOLE_PROPRIETOR',
                    tinType: 'SSN',
                    tinMasked: '',
                    address: '',
                    city: '',
                    state: 'PA',
                    zipCode: '',
                    certifiedSignature: '',
                    certifiedAt: '',
                    is1099Eligible: true,
                  } : null;

                  setData((prev) => ({
                    ...prev,
                    employees: [...(prev.employees || []), newEmp],
                    w9Records: newW9Record ? [...(prev.w9Records || []), newW9Record] : (prev.w9Records || []),
                  }));
                  return newId;
                }}
              />
            )}

            {activeTab === 'PAYROLL' && (
              <AssistedPayrollView
                employees={data.employees}
                org={data.org}
                mileageLogs={data.mileageLogs}
                travelExpenses={data.travelExpenses}
                payrollRuns={data.payrollRuns}
                payStubs={data.payStubs}
                timesheets={data.timesheets}
                activeTaxYear={currentActiveTaxYear}
                onCreatePayrollRun={(runData, stubsData) => {
                  if (isFutureYear(currentActiveTaxYear) || isFutureDateString(runData.periodEnd) || isFutureDateString(runData.payDate)) {
                    console.warn(`Cannot create payroll run for future tax year (${currentActiveTaxYear})`);
                    return;
                  }
                  const runId = `run_${Date.now()}`;
                  const newRun: PayrollRun = {
                    ...runData,
                    id: runId,
                    createdAt: new Date().toISOString(),
                  };
                  const newStubs: PayStub[] = stubsData.map((s, idx) => ({
                    ...s,
                    id: `stub_${Date.now()}_${idx}`,
                    payrollRunId: runId,
                    createdAt: new Date().toISOString(),
                  }));
                  setData(prev => ({
                    ...prev,
                    payrollRuns: [newRun, ...prev.payrollRuns],
                    payStubs: [...newStubs, ...prev.payStubs]
                  }));
                }}
                onUpdateStubDisbursement={(stubId, zelleRef) => {
                  setData(prev => ({
                    ...prev,
                    payStubs: prev.payStubs.map(s => s.id === stubId ? { ...s, disbursementStatus: 'PAID', zelleConfirmationRef: zelleRef, paidAt: new Date().toISOString() } : s)
                  }));
                }}
              />
            )}

            {activeTab === 'COMPLIANCE' && (
              <ComplianceFilingsView
                complianceTasks={data.complianceTasks}
                org={data.org}
                employees={data.employees}
                payrollRuns={data.payrollRuns}
                payStubs={data.payStubs}
                activeTaxYear={currentActiveTaxYear}
                onMarkTaskFiled={state.handleMarkTaskFiled}
                onNavigateToAuditTrail={() => setActiveTab('AUDIT_LOGS')}
              />
            )}

            {activeTab === 'TAX_RULES' && (
              <TaxRuleAdminView employees={data.employees} />
            )}

            {activeTab === 'TAX_COVERAGE' && (
              <TaxRuleCoverageMatrixView company={data.org || data.company} employees={data.employees} />
            )}

            {activeTab === 'ASSETS' && (
              <AssetDepreciationView company={data.org || data.company} />
            )}

            {activeTab === 'HOME_OFFICE' && (
              <HomeOfficeView company={data.org || data.company} />
            )}

            {activeTab === 'TAX_SIMULATOR' && (
              <TaxImpactSimulatorView company={data.org || data.company} />
            )}

            {activeTab === 'AUDIT_LOGS' && (
              <AuditTrailView logs={data.auditLogs || []} />
            )}

            {activeTab === 'EXPORT' && (
              <YearEndExportView data={data} />
            )}

            {activeTab === 'SETTINGS' && (
              <SettingsView
                org={data.org}
                employees={data.employees}
                allData={data}
                onSaveOrg={handleSaveOrg}
                onSaveEmployees={(newEmployees) => setData(prev => ({ ...prev, employees: newEmployees }))}
                onResetAllData={() => setData(prev => ({ ...prev, generalExpenses: [], mileageLogs: [], travelExpenses: [], payrollRuns: [], payStubs: [], timesheets: [], auditLogs: [] }))}
                onExportJSON={() => {
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `taxshield_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
                onImportJSON={(jsonData) => {
                  if (jsonData && typeof jsonData === 'object') {
                    setData(jsonData);
                  }
                }}
              />
            )}
          </Suspense>
        </ErrorBoundary>
        </main>
      </div>

      {/* LLC Setup Onboarding Modal (Automatically opened if company setup is missing) */}
      <LLCOnboardingModal
        isOpen={shouldShowOnboardingModal}
        initialOrg={data.org}
        isDismissable={isConfigured}
        onSave={(newOrg, taxYear) => {
          handleSaveOrg(newOrg);
          if (taxYear) {
            handleCreateTaxYear(taxYear);
          }
          setShowOnboarding(false);
        }}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Dedicated Tax Year Setup Modal */}
      <TaxYearSetupModal
        isOpen={showTaxYearModal}
        activeYear={data.activeTaxYear || 2026}
        existingYears={data.taxYears}
        onSave={(year) => {
          handleCreateTaxYear(year);
        }}
        onClose={() => setShowTaxYearModal(false)}
      />
    </div>
  );
}

function AuthenticatedApp() {
  const appState = useAppState();
  return <MainAppContent state={appState} />;
}

export default function App() {
  const isW9Onboarding = typeof window !== 'undefined' && window.location.pathname.startsWith('/onboard/w9');
  if (isW9Onboarding) {
    return (
      <FontSizeProvider>
        <PublicW9OnboardingView />
      </FontSizeProvider>
    );
  }

  return (
    <FontSizeProvider>
      <AuthProvider>
        <AuthGate>
          <AuthenticatedApp />
        </AuthGate>
      </AuthProvider>
    </FontSizeProvider>
  );
}

