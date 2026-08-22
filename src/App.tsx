import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Car, 
  Calculator, 
  Landmark, 
  TrendingDown, 
  FileText, 
  Settings,
  LogOut,
  UserCheck
} from 'lucide-react';
import { 
  loadAllAppData, 
  saveAllAppData, 
  resetToSeedData,
  clearToFreshRealApp
} from './utils/storage';
import { MileageAndTravelView } from './components/MileageAndTravelView';
import { AssistedPayrollView } from './components/AssistedPayrollView';
import { ComplianceFilingsView } from './components/ComplianceFilingsView';
import { PassThroughSimulatorView } from './components/PassThroughSimulatorView';
import { PRDDocView } from './components/PRDDocView';
import { SettingsView } from './components/SettingsView';
import { AuthGate } from './components/AuthGate';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { StepWorkflowBanner } from './components/StepWorkflowBanner';
import { useAuth } from './context/AuthContext';
import { 
  Organization, 
  Employee, 
  MileageLog, 
  TravelExpense, 
  PayrollRun, 
  PayStub
} from './types';

type ActiveTab = 'MILEAGE' | 'PAYROLL' | 'COMPLIANCE' | 'SIMULATOR' | 'PRD' | 'SETTINGS';

function MainAppContent() {
  const [data, setData] = useState(() => loadAllAppData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('MILEAGE');
  const { user, logOut } = useAuth();

  // Sync to local storage whenever data changes
  useEffect(() => {
    saveAllAppData(data);
  }, [data]);

  // Handlers for Mileage & Travel
  const handleAddMileage = (newTrip: Omit<MileageLog, 'id' | 'createdAt' | 'mileageAllowance' | 'calculatedMiles'>) => {
    const calculatedMiles = Math.max(0, newTrip.endOdometer - newTrip.startOdometer);
    const mileageAllowance = Math.round(calculatedMiles * newTrip.rateApplied * 100) / 100;
    const log: MileageLog = {
      ...newTrip,
      id: `mile_${Date.now()}`,
      calculatedMiles,
      mileageAllowance,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      mileageLogs: [log, ...prev.mileageLogs]
    }));
  };

  const handleDeleteMileage = (id: string) => {
    setData(prev => ({
      ...prev,
      mileageLogs: prev.mileageLogs.filter(m => m.id !== id)
    }));
  };

  const handleAddTravelExpense = (newExp: Omit<TravelExpense, 'id' | 'createdAt'>) => {
    const exp: TravelExpense = {
      ...newExp,
      id: `trv_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      travelExpenses: [exp, ...prev.travelExpenses]
    }));
  };

  const handleDeleteTravelExpense = (id: string) => {
    setData(prev => ({
      ...prev,
      travelExpenses: prev.travelExpenses.filter(t => t.id !== id)
    }));
  };

  // Handlers for Payroll
  const handleCreatePayrollRun = (
    runData: Omit<PayrollRun, 'id' | 'createdAt'>,
    stubsData: Omit<PayStub, 'id' | 'payrollRunId' | 'createdAt'>[]
  ) => {
    const runId = `run_${Date.now()}`;
    const newRun: PayrollRun = {
      ...runData,
      id: runId,
      createdAt: new Date().toISOString(),
      lockedAt: new Date().toISOString(),
    };

    const newStubs: PayStub[] = stubsData.map((s, idx) => ({
      ...s,
      id: `stub_${Date.now()}_${idx}`,
      payrollRunId: runId,
      createdAt: new Date().toISOString(),
    }));

    // Mark included mileage & expenses as reimbursed
    const updatedMileage = data.mileageLogs.map(m => {
      if (m.status === 'APPROVED' && !m.linkedPayStubId) {
        return { ...m, status: 'REIMBURSED' as const, linkedPayStubId: runId };
      }
      return m;
    });

    const updatedExpenses = data.travelExpenses.map(t => {
      if (t.status === 'APPROVED' && !t.linkedPayStubId) {
        return { ...t, status: 'REIMBURSED' as const, linkedPayStubId: runId };
      }
      return t;
    });

    setData(prev => ({
      ...prev,
      payrollRuns: [newRun, ...prev.payrollRuns],
      payStubs: [...newStubs, ...prev.payStubs],
      mileageLogs: updatedMileage,
      travelExpenses: updatedExpenses,
    }));
  };

  const handleUpdateStubDisbursement = (stubId: string, zelleRef: string) => {
    setData(prev => ({
      ...prev,
      payStubs: prev.payStubs.map(s => {
        if (s.id === stubId) {
          return {
            ...s,
            disbursementStatus: 'PAID' as const,
            zelleConfirmationRef: zelleRef,
            paidAt: new Date().toISOString(),
          };
        }
        return s;
      })
    }));
  };

  // Handlers for Compliance
  const handleMarkTaskFiled = (taskId: string, confirmationNum: string) => {
    setData(prev => ({
      ...prev,
      complianceTasks: prev.complianceTasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'FILED' as const,
            confirmationNumber: confirmationNum,
            filedDate: new Date().toISOString().split('T')[0],
          };
        }
        return t;
      })
    }));
  };

  // Handlers for Settings & Tax Bracket
  const handleUpdateTaxBracket = (bracket: number) => {
    setData(prev => ({
      ...prev,
      org: { ...prev.org, ownerTaxBracket: bracket }
    }));
  };

  const handleSaveOrg = (updatedOrg: Organization) => {
    setData(prev => ({ ...prev, org: updatedOrg }));
  };

  const handleSaveEmployees = (updatedEmployees: Employee[]) => {
    setData(prev => ({ ...prev, employees: updatedEmployees }));
  };

  const handleResetAll = () => {
    if (window.confirm('Reset all records back to sample demo data?')) {
      const reset = resetToSeedData();
      setData(reset);
    }
  };

  const handleClearToFresh = () => {
    if (window.confirm('Clear all sample records to start with a fresh, clean slate? Your LLC entity profile will be preserved.')) {
      const fresh = clearToFreshRealApp();
      setData(fresh);
    }
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `TaxShield_Ledger_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (jsonData: any) => {
    if (jsonData && jsonData.org && jsonData.employees) {
      setData(jsonData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-150">
      
      {/* Primary Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & Entity Details */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  TaxShield Ledger
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-medium">
                    PA & IRS Micro-LLC
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{data.org.name} • EIN: {data.org.ein}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeSwitcher />
              {user && (
                <button
                  onClick={() => logOut()}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tab Pills */}
          <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
            <button
              id="nav-tab-mileage"
              onClick={() => setActiveTab('MILEAGE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'MILEAGE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>1. Mileage & Travel</span>
            </button>

            <button
              id="nav-tab-payroll"
              onClick={() => setActiveTab('PAYROLL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PAYROLL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>2. Assisted Payroll</span>
            </button>

            <button
              id="nav-tab-compliance"
              onClick={() => setActiveTab('COMPLIANCE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'COMPLIANCE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>3. PA & IRS Filings</span>
            </button>

            <button
              id="nav-tab-simulator"
              onClick={() => setActiveTab('SIMULATOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SIMULATOR'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>4. Tax Strategy</span>
            </button>

            <button
              id="nav-tab-prd"
              onClick={() => setActiveTab('PRD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'PRD'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>5. PRD Reference</span>
            </button>

            <button
              id="nav-tab-settings"
              onClick={() => setActiveTab('SETTINGS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SETTINGS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right Controls: Theme Switcher & Auth status */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeSwitcher />
            
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-medium">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={() => logOut()}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Step-by-Step Workflow Guide Banner */}
      <div className="max-w-7xl mx-auto px-4 pt-6 w-full">
        <StepWorkflowBanner
          currentStep={
            activeTab === 'SETTINGS' ? 'STEP_ORG' :
            activeTab === 'MILEAGE' ? 'STEP_MILEAGE' :
            activeTab === 'PAYROLL' ? 'STEP_PAYROLL' :
            activeTab === 'COMPLIANCE' ? 'STEP_COMPLIANCE' :
            'STEP_SIMULATOR'
          }
          onSelectStep={(step) => {
            if (step === 'STEP_ORG' || step === 'STEP_EMPLOYEES') {
              setActiveTab('SETTINGS');
            } else if (step === 'STEP_MILEAGE') {
              setActiveTab('MILEAGE');
            } else if (step === 'STEP_PAYROLL') {
              setActiveTab('PAYROLL');
            } else if (step === 'STEP_COMPLIANCE') {
              setActiveTab('COMPLIANCE');
            } else if (step === 'STEP_SIMULATOR') {
              setActiveTab('SIMULATOR');
            }
          }}
          org={data.org}
          employees={data.employees}
          mileageLogs={data.mileageLogs}
          payrollRuns={data.payrollRuns}
          complianceTasks={data.complianceTasks}
        />
      </div>

      {/* Main View Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {activeTab === 'MILEAGE' && (
          <MileageAndTravelView
            mileageLogs={data.mileageLogs}
            travelExpenses={data.travelExpenses}
            employees={data.employees}
            org={data.org}
            onAddMileage={handleAddMileage}
            onDeleteMileage={handleDeleteMileage}
            onAddTravelExpense={handleAddTravelExpense}
            onDeleteTravelExpense={handleDeleteTravelExpense}
          />
        )}

        {activeTab === 'PAYROLL' && (
          <AssistedPayrollView
            employees={data.employees}
            org={data.org}
            payrollRuns={data.payrollRuns}
            payStubs={data.payStubs}
            mileageLogs={data.mileageLogs}
            travelExpenses={data.travelExpenses}
            onCreatePayrollRun={handleCreatePayrollRun}
            onUpdateStubDisbursement={handleUpdateStubDisbursement}
          />
        )}

        {activeTab === 'COMPLIANCE' && (
          <ComplianceFilingsView
            complianceTasks={data.complianceTasks}
            org={data.org}
            payrollRuns={data.payrollRuns}
            payStubs={data.payStubs}
            onMarkTaskFiled={handleMarkTaskFiled}
          />
        )}

        {activeTab === 'SIMULATOR' && (
          <PassThroughSimulatorView
            org={data.org}
            payrollRuns={data.payrollRuns}
            payStubs={data.payStubs}
            mileageLogs={data.mileageLogs}
            travelExpenses={data.travelExpenses}
            generalExpenses={data.generalExpenses}
            onUpdateTaxBracket={handleUpdateTaxBracket}
          />
        )}

        {activeTab === 'PRD' && (
          <PRDDocView />
        )}

        {activeTab === 'SETTINGS' && (
          <SettingsView
            org={data.org}
            employees={data.employees}
            onSaveOrg={handleSaveOrg}
            onSaveEmployees={handleSaveEmployees}
            onResetAllData={handleResetAll}
            onClearToFreshSlate={handleClearToFresh}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
          />
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-4 px-4 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TaxShield Ledger • Micro-LLC Zero-Cost Tax & Compliance Engine</span>
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
            <span>PA Statutory Flat SIT (3.07%)</span>
            <span>•</span>
            <span>IRS 5-Point Rule (Treas. Reg. § 1.274-5)</span>
            <span>•</span>
            <span>Authorized: tovijayan@gmail.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <MainAppContent />
    </AuthGate>
  );
}
