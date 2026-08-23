import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Users, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Code2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Organization, Employee } from '../types';
import { PostgresSettingsPanel } from './PostgresSettingsPanel';
import { AllAppData } from '../utils/storage';

interface SettingsViewProps {
  org: Organization;
  employees: Employee[];
  allData?: AllAppData;
  onSaveOrg: (org: Organization) => void;
  onSaveEmployees: (employees: Employee[]) => void;
  onResetAllData: () => void;
  onClearToFreshSlate?: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonData: any) => void;
  onSyncToPostgres?: () => Promise<void>;
  onPullFromPostgres?: () => Promise<void>;
}

export function SettingsView({
  org,
  employees,
  allData,
  onSaveOrg,
  onSaveEmployees,
  onResetAllData,
  onClearToFreshSlate,
  onExportJSON,
  onImportJSON,
  onSyncToPostgres,
  onPullFromPostgres
}: SettingsViewProps) {
  const [orgForm, setOrgForm] = useState<Organization>({ ...org });
  const [employeeList, setEmployeeList] = useState<Employee[]>([...employees]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveOrg(orgForm);
    setSavedSuccess(true);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleUpdateEmployee = (index: number, field: keyof Employee, value: any) => {
    const updated = [...employeeList];
    updated[index] = { ...updated[index], [field]: value };
    setEmployeeList(updated);
  };

  const handleAddEmployee = () => {
    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      firstName: 'New',
      lastName: 'Staff',
      email: 'staff@example.com',
      phone: '(555) 000-0000',
      ssnLastFour: '1234',
      employmentType: 'W2_HOURLY',
      payRate: 20.00,
      payFrequency: 'BI_WEEKLY',
      w4FilingStatus: 'SINGLE',
      w4MultipleJobs: false,
      w4DependentCredit: 0,
      w4OtherIncome: 0,
      w4Deductions: 0,
      w4ExtraWithholding: 0,
      paPsdCode: '460401',
      paPsdName: 'Montgomery County PSD',
      paResidentEitRate: 0.0100,
      paWorkPsdCode: '510101',
      paWorkEitRate: 0.0375,
      paLstAnnual: 52.00,
      paLstExempt: false,
      zelleHandle: 'staff.pay@example.com',
      isActive: true,
    };
    const updated = [...employeeList, newEmp];
    setEmployeeList(updated);
    onSaveEmployees(updated);
  };

  const handleDeleteEmployee = (id: string) => {
    if (employeeList.length <= 1) return;
    const updated = employeeList.filter(e => e.id !== id);
    setEmployeeList(updated);
    onSaveEmployees(updated);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        onImportJSON(json);
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Organization & Tax Parameters</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure legal LLC details, employee W-4 withholdings, PA PSD codes, and manage backups for Vercel/GitHub deployment.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" /> Settings Saved!
          </span>
        )}
      </div>

      {/* Grid: LLC Setup & Employee Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LLC Legal Entity Details */}
        <form onSubmit={handleSaveOrg} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">LLC Legal Information</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Company Legal Name *</label>
              <input
                type="text"
                required
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Federal EIN *</label>
                <input
                  type="text"
                  required
                  value={orgForm.ein}
                  onChange={(e) => setOrgForm({ ...orgForm, ein: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">PA State Tax ID *</label>
                <input
                  type="text"
                  required
                  value={orgForm.stateTaxId}
                  onChange={(e) => setOrgForm({ ...orgForm, stateTaxId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Business Address *</label>
              <input
                type="text"
                required
                value={orgForm.address}
                onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">City</label>
                <input
                  type="text"
                  value={orgForm.city}
                  onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">State</label>
                <input
                  type="text"
                  value={orgForm.state}
                  onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">ZIP</label>
                <input
                  type="text"
                  value={orgForm.zip}
                  onChange={(e) => setOrgForm({ ...orgForm, zip: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Managing Member Name</label>
                <input
                  type="text"
                  value={orgForm.ownerName}
                  onChange={(e) => setOrgForm({ ...orgForm, ownerName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">IRS Mileage Rate ($/mi)</label>
                <input
                  type="number"
                  step="0.01"
                  value={orgForm.standardMileageRate}
                  onChange={(e) => setOrgForm({ ...orgForm, standardMileageRate: parseFloat(e.target.value) || 0.67 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-700/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save LLC Profile</span>
            </button>
          </div>
        </form>

        {/* Staff Roster & Tax Classification */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Staff Roster & PSD Setup</h3>
            </div>
            <button
              onClick={handleAddEmployee}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {employeeList.map((emp, index) => (
              <div key={emp.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={emp.firstName}
                      onChange={(e) => handleUpdateEmployee(index, 'firstName', e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white font-semibold text-xs w-24"
                      placeholder="First Name"
                    />
                    <input
                      type="text"
                      value={emp.lastName}
                      onChange={(e) => handleUpdateEmployee(index, 'lastName', e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white font-semibold text-xs w-28"
                      placeholder="Last Name"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">${emp.payRate}/hr</span>
                    {employeeList.length > 1 && (
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        title="Remove employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block">Zelle Phone/Email</label>
                    <input
                      type="text"
                      value={emp.zelleHandle}
                      onChange={(e) => handleUpdateEmployee(index, 'zelleHandle', e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block">Pay Rate ($/hr)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={emp.payRate}
                      onChange={(e) => handleUpdateEmployee(index, 'payRate', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800/60">
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block">PA Resident PSD Code</label>
                    <input
                      type="text"
                      value={emp.paPsdCode}
                      onChange={(e) => handleUpdateEmployee(index, 'paPsdCode', e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 block">Resident EIT Rate (e.g. 0.01)</label>
                    <input
                      type="number"
                      step="0.0025"
                      value={emp.paResidentEitRate}
                      onChange={(e) => handleUpdateEmployee(index, 'paResidentEitRate', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                onSaveEmployees(employeeList);
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 2000);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-700/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Staff Setup</span>
            </button>
          </div>
        </div>

      </div>

      {/* PostgreSQL / Vercel Postgres Cloud Database Panel */}
      {allData && (
        <PostgresSettingsPanel
          currentData={allData}
          onSyncToPostgres={onSyncToPostgres || (async () => {})}
          onPullFromPostgres={onPullFromPostgres || (async () => {})}
        />
      )}

      {/* Data Management & Deployment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Backup & Data Restore */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Data Portability & State Controls</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Export complete financial records, 5-point mileage logs, pay stubs, and compliance filings as a JSON backup, or clear to a clean state.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onExportJSON}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export Full JSON Backup</span>
            </button>

            <label className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs">
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Import JSON Backup</span>
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>

            {onClearToFreshSlate && (
              <button
                onClick={onClearToFreshSlate}
                className="px-3 py-2 text-xs font-medium rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Clear to Clean Slate</span>
              </button>
            )}

            <button
              onClick={onResetAllData}
              className="px-3 py-2 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Sample Data</span>
            </button>
          </div>
        </div>

        {/* Antigravity / GitHub / Vercel Deployment Instructions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Vercel & GitHub / Antigravity Setup</h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
            This application is built with React 19 + Vite and is fully ready for one-click deployment on <strong>Vercel</strong> or export to <strong>GitHub & Antigravity IDE</strong>:
          </p>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1 border border-slate-200 dark:border-slate-800">
            <p className="text-slate-400 dark:text-slate-500"># 1. Clone or sync repository in GitHub / Antigravity IDE</p>
            <p className="text-emerald-700 dark:text-emerald-400">git clone &lt;repo-url&gt; && npm install</p>
            <p className="text-slate-400 dark:text-slate-500 pt-1"># 2. Deploy to Vercel (zero config required)</p>
            <p className="text-emerald-700 dark:text-emerald-400">vercel --prod</p>
          </div>
        </div>

      </div>
    </div>
  );
}
