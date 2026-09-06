import React, { useState, Suspense } from 'react';
import { 
  Database, 
  UserCheck, 
  LogOut, 
  Building2 
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
import { isOrgConfigured } from './utils/storage';
import { useAppState } from './hooks/useAppState';
import { getTaskTaxYear, isFutureYear, isFutureDateString } from './utils/taxEngine';
import { PayrollRun, PayStub } from './types';

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
  } = state;

  const { user, membership, isOwner, isEmployee, isReadOnly, employeeProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => (isEmployee ? 'MY_DOCUMENTS' : 'DASHBOARD'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

      {/* Sidebar Navigation */}
      <NavigationSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
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
      />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{data?.company?.name || data?.org?.name || 'Micro-LLC Setup Pending'}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-indigo-600 dark:text-indigo-300 font-bold">Tax Year {currentActiveTaxYear} Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Switcher Toggle */}
            <ThemeSwitcher />

            {/* Font Size Selector Control */}
            <FontSizeControl />

            {/* Postgres Connection Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <Database className={`w-3.5 h-3.5 ${dbStatus?.connected ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`} />
              <span className={dbStatus?.connected ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                {dbStatus?.connected ? 'Postgres Connected' : 'Postgres Offline'}
              </span>
            </div>

            {/* User Profile / Logout */}
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <UserCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="hidden sm:inline" title={user?.email || 'Logged In User'}>
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
          <div className="mx-6 mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-900/90 to-violet-900/90 border border-indigo-500/40 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-indigo-300" />
              <div>
                <h4 className="font-bold text-sm">LLC & Tax Year Configuration Required</h4>
                <p className="text-xs text-indigo-200">Set up your Pennsylvania LLC EIN, owner classification, and active Tax Year to start automated payroll & filings.</p>
              </div>
            </div>
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
            >
              Configure LLC & Tax Year
            </button>
          </div>
        )}

        {/* Dynamic Content Views with Suspense */}
        <main className="p-6">
          <Suspense fallback={<ViewLoadingSkeleton />}>
            {activeTab === 'DASHBOARD' && (
              <DashboardOverviewView data={data} onNavigateTab={setActiveTab} />
            )}

            {activeTab === 'EXPENSES' && (
              <ExpenseTrackerView
                expenses={data.generalExpenses}
                activeTaxYear={currentActiveTaxYear}
                onAddExpense={handleAddGeneralExpense}
                onDeleteExpense={handleDeleteGeneralExpense}
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

            {activeTab === 'TIMESHEETS' && (
              <TimesheetsView
                timesheets={data.timesheets}
                employees={data.employees}
                activeTaxYear={currentActiveTaxYear}
                isReadOnly={isReadOnly}
                onAddTimesheet={handleAddTimesheet}
                onBulkAddTimesheets={handleBulkAddTimesheets}
                onUpdateTimesheetStatus={handleUpdateTimesheetStatus}
                onDeleteTimesheet={handleDeleteTimesheet}
                onNavigateToPayroll={() => setActiveTab('PAYROLL')}
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
                    payStubs: prev.payStubs.map(s => s.id === stubId ? { ...s, disbursementStatus: 'PAID', zelleConfirmationRef: zelleRef, paidAt: new Date() } : s)
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

