import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2,
  Sparkles,
  Pencil,
  ShieldCheck,
  Calendar,
  MapPin,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Organization, Employee } from '../types';
import { AllAppData, isCompanyConfigured } from '../utils/storage';

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
  onSaveOrg,
  onResetAllData,
  onClearToFreshSlate,
  onExportJSON,
  onImportJSON,
}: SettingsViewProps) {
  const [orgForm, setOrgForm] = useState<Organization>({ ...org });
  const [isEditing, setIsEditing] = useState<boolean>(!isCompanyConfigured(org));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingMercury, setTestingMercury] = useState(false);
  const [mercuryTestResult, setMercuryTestResult] = useState<{ success: boolean; message: string; accounts?: any[] } | null>(null);

  useEffect(() => {
    setOrgForm({ ...org });
  }, [org]);

  const handleTestMercuryConnection = async () => {
    if (!orgForm.mercuryApiKey) {
      setMercuryTestResult({ success: false, message: 'Please enter a Mercury API key first.' });
      return;
    }
    setTestingMercury(true);
    setMercuryTestResult(null);
    try {
      const res = await fetch('/api/mercury/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: orgForm.mercuryApiKey,
          environment: orgForm.mercuryEnvironment || 'SANDBOX',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMercuryTestResult({
          success: true,
          message: `Connected to Mercury (${orgForm.mercuryEnvironment || 'SANDBOX'}). ${data.accounts?.length || 0} account(s) found.`,
          accounts: data.accounts,
        });
        if (data.accounts?.length > 0) {
          const checking = data.accounts.find((a: any) => (a.name || '').toLowerCase().includes('checking'));
          const defaultAccId = checking ? checking.id : data.accounts[0].id;
          if (!orgForm.mercuryAccountId) {
            setOrgForm(prev => ({ ...prev, mercuryAccountId: defaultAccId }));
          }
        }
      } else {
        setMercuryTestResult({ success: false, message: data.error || 'Failed to connect to Mercury API.' });
      }
    } catch (err: any) {
      setMercuryTestResult({ success: false, message: err.message || 'Network error testing Mercury API.' });
    } finally {
      setTestingMercury(false);
    }
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveOrg(orgForm);
    setSavedSuccess(true);
    setIsEditing(false);
    confetti({ particleCount: 35, spread: 60 });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCancelEdit = () => {
    setOrgForm({ ...org });
    setIsEditing(false);
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

  const payFrequencyLabelMap: Record<string, string> = {
    BI_WEEKLY: 'Bi-Weekly (26 Pay Periods/yr)',
    WEEKLY: 'Weekly (52 Pay Periods/yr)',
    SEMI_MONTHLY: 'Semi-Monthly (24 Pay Periods/yr)',
    MONTHLY: 'Monthly (12 Pay Periods/yr)',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">LLC Setup & System Parameters</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official legal entity parameters, Pennsylvania tax registration, mileage rates, and data backup controls.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 shadow-xs shrink-0">
            <CheckCircle2 className="w-4 h-4" /> Changes Saved!
          </span>
        )}
      </div>

      {/* LLC Legal Entity Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">LLC Legal Information</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Entity details registered with IRS & PA Department of Revenue</p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Edit Entity Details</span>
            </button>
          )}
        </div>

        {!isEditing ? (
          /* Executive Summary Mode (Read-Only) */
          <div className="space-y-5">
            {/* Entity Header Banner */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">{org.name || 'Unnamed LLC'}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {org.state || 'PA'} Single-Member LLC
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {org.address ? `${org.address}, ${org.city}, ${org.state} ${org.zip}` : 'No address specified'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-xs">
                  EIN: {org.ein || 'Not Set'}
                </span>
                <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-xs">
                  PA ID: {org.stateTaxId || 'Not Set'}
                </span>
              </div>
            </div>

            {/* Key Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Managing Member
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{org.ownerName || 'Not Set'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Payroll Schedule
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {payFrequencyLabelMap[org.payFrequency || 'BI_WEEKLY']}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Standard IRS Mileage
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                  ${(org.standardMileageRate || 0.67).toFixed(2)} / mile
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Edit Form */
          <form onSubmit={handleSaveOrg} className="space-y-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">PA State Tax ID *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.stateTaxId}
                    onChange={(e) => setOrgForm({ ...orgForm, stateTaxId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">City</label>
                  <input
                    type="text"
                    value={orgForm.city}
                    onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">State</label>
                  <input
                    type="text"
                    value={orgForm.state}
                    onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">ZIP</label>
                  <input
                    type="text"
                    value={orgForm.zip}
                    onChange={(e) => setOrgForm({ ...orgForm, zip: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">IRS Mileage Rate ($/mi)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={orgForm.standardMileageRate}
                    onChange={(e) => setOrgForm({ ...orgForm, standardMileageRate: parseFloat(e.target.value) || 0.67 })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Payroll Schedule (Pay Frequency)</label>
                <select
                  value={orgForm.payFrequency || 'BI_WEEKLY'}
                  onChange={(e) => setOrgForm({ ...orgForm, payFrequency: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="BI_WEEKLY">Bi-Weekly (26 Pay Periods/yr)</option>
                  <option value="WEEKLY">Weekly (52 Pay Periods/yr)</option>
                  <option value="SEMI_MONTHLY">Semi-Monthly (24 Pay Periods/yr)</option>
                  <option value="MONTHLY">Monthly (12 Pay Periods/yr)</option>
                </select>
              </div>

              {/* Mercury Bank API Integration Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Company Bank & Mercury API Setup</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700">
                    Automated Tax ACH
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mercury Bank"
                      value={orgForm.bankName || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, bankName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Routing Number</label>
                    <input
                      type="text"
                      placeholder="9-digit ACH Routing"
                      value={orgForm.routingNumber || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, routingNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Account Number</label>
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={orgForm.accountNumber || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, accountNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="col-span-2">
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mercury API Secret Key</label>
                    <input
                      type="password"
                      placeholder="secret-token:api-sandbox:... (or enter 'test' for Sandbox demo)"
                      value={orgForm.mercuryApiKey || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, mercuryApiKey: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Include full string starting with <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">secret-token:</code> as copied from Mercury Dashboard (or type <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">test</code> for instant Sandbox mode).
                    </p>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Environment</label>
                    <select
                      value={orgForm.mercuryEnvironment || 'SANDBOX'}
                      onChange={(e) => setOrgForm({ ...orgForm, mercuryEnvironment: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="SANDBOX">Sandbox (Testing)</option>
                      <option value="PRODUCTION">Production (Live)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTestMercuryConnection}
                    disabled={testingMercury}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{testingMercury ? 'Connecting to Mercury...' : 'Test Mercury API Connection'}</span>
                  </button>

                  {mercuryTestResult && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      mercuryTestResult.success
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                    }`}>
                      {mercuryTestResult.message}
                    </span>
                  )}
                </div>

                {mercuryTestResult?.accounts && mercuryTestResult.accounts.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Select Mercury Funding Account for Tax Remittances</label>
                    <select
                      value={orgForm.mercuryAccountId || ''}
                      onChange={(e) => setOrgForm({ ...orgForm, mercuryAccountId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      {mercuryTestResult.accounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.accountNumber || acc.id}) — Available: ${acc.availableBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {isCompanyConfigured(org) && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-700/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save LLC Details</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Data Management Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Data Portability & State Controls</span>
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs">
          Export complete financial records, 5-point mileage logs, pay stubs, and compliance filings as a JSON backup, or reset data.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onExportJSON}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Full JSON Backup</span>
          </button>

          <label className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Import JSON Backup</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          {onClearToFreshSlate && (
            <button
              onClick={onClearToFreshSlate}
              className="px-3 py-2 text-xs font-medium rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Clear to Clean Slate</span>
            </button>
          )}

          <button
            onClick={onResetAllData}
            className="px-3 py-2 text-xs font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
