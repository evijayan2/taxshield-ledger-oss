import React, { useState } from 'react';
import { Company, CapitalAsset } from 'taxshield-ledger-core';
import { calculateAssetDepreciationSchedule } from 'taxshield-ledger-core';
import { Plus, X, Calculator, Download, CheckCircle, FileText, ArrowRight, Laptop, Truck, Building, Package } from 'lucide-react';

interface Props {
  company: Company;
}

export const AssetDepreciationView: React.FC<Props> = ({ company }) => {
  // Starts fresh with 0 initial assets (user logs real capital assets via the drawer)
  const [assets, setAssets] = useState<CapitalAsset[]>([]);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<CapitalAsset>>({
    category: 'COMPUTERS_SOFTWARE',
    datePlacedInService: new Date().toISOString().split('T')[0],
    costBasis: 0,
    businessUsePercent: 100,
    depreciationMethod: 'MACRS_200_DB',
    recoveryPeriodYears: 5,
    section179Claimed: 0,
  });

  const [selectedAssetSchedule, setSelectedAssetSchedule] = useState<CapitalAsset | null>(null);

  const schedules = assets.map((a) => calculateAssetDepreciationSchedule(a, 2026));

  const totalCostBasis = schedules.reduce((sum, s) => sum + s.costBasis, 0);
  const totalBusinessBasis = schedules.reduce((sum, s) => sum + s.businessBasis, 0);
  const totalCurrentYearDep = schedules.reduce((sum, s) => sum + s.currentYearDepreciation, 0);
  const totalSection179 = schedules.reduce((sum, s) => sum + s.form4562Part1Section179, 0);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.assetName || !newAsset.costBasis) return;

    const created: CapitalAsset = {
      id: `ast-${Date.now()}`,
      companyId: company.id,
      assetName: newAsset.assetName,
      category: newAsset.category as any,
      datePlacedInService: newAsset.datePlacedInService || new Date().toISOString().split('T')[0],
      costBasis: Number(newAsset.costBasis),
      businessUsePercent: Number(newAsset.businessUsePercent || 100),
      depreciationMethod: (newAsset.depreciationMethod as any) || 'MACRS_200_DB',
      recoveryPeriodYears: Number(newAsset.recoveryPeriodYears || 5),
      section179Claimed: Number(newAsset.section179Claimed || 0),
      priorDepreciation: 0,
    };

    setAssets([...assets, created]);
    setIsAddDrawerOpen(false);
    setNewAsset({
      category: 'COMPUTERS_SOFTWARE',
      datePlacedInService: new Date().toISOString().split('T')[0],
      costBasis: 0,
      businessUsePercent: 100,
      depreciationMethod: 'MACRS_200_DB',
      recoveryPeriodYears: 5,
      section179Claimed: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Phase 2 Asset Ledger
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                IRS Form 4562 & Schedule C Line 13
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Capital Asset & Depreciation Tracking
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Manage machinery, vehicles, office technology, Section 179 elections, and MACRS depreciation schedules.
            </p>
          </div>

          <button
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all w-full sm:w-auto shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Capital Asset
          </button>
        </div>

        {/* Summary Stat Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Cost Basis
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              ${totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Business Allocated Basis
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              ${totalBusinessBasis.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Section 179 Expense
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              ${totalSection179.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Schedule C Line 13 Total
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              ${totalCurrentYearDep.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Asset Inventory & 2026 Depreciation
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {assets.length} Active Assets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Asset & Category</th>
                <th className="py-3.5 px-4">Placed In Service</th>
                <th className="py-3.5 px-4 text-right">Cost Basis</th>
                <th className="py-3.5 px-4 text-right">Business %</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">2026 Deduction</th>
                <th className="py-3.5 px-4 text-right">Remaining Basis</th>
                <th className="py-3.5 px-4 text-center">Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {assets.map((asset) => {
                const sched = calculateAssetDepreciationSchedule(asset, 2026);
                return (
                  <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {asset.assetName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {asset.category.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{asset.datePlacedInService}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      ${asset.costBasis.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">{asset.businessUsePercent}%</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                          asset.depreciationMethod === 'SECTION_179'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {asset.depreciationMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ${sched.currentYearDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-700 dark:text-slate-300">
                      ${sched.remainingBasis.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedAssetSchedule(asset)}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        View Year Grid
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Drawer for Adding New Asset */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-lg w-full flex pl-0 sm:pl-10">
            <div className="w-full glass-panel bg-white/95 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Capital Asset
                </h3>
                <button onClick={() => setIsAddDrawerOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAsset} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Asset Name / Description
                  </label>
                  <input
                    type="text"
                    required
                    value={newAsset.assetName || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, assetName: e.target.value })}
                    placeholder="e.g. Server Rack Equipment"
                    className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={newAsset.category}
                      onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value as any })}
                      className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="COMPUTERS_SOFTWARE">Computers / Software</option>
                      <option value="MACHINERY_EQUIPMENT">Machinery / Equipment</option>
                      <option value="VEHICLE">Business Vehicle</option>
                      <option value="FURNITURE_FIXTURES">Furniture / Fixtures</option>
                      <option value="BUILDINGS_IMPROVEMENTS">Improvements</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Date Placed in Service
                    </label>
                    <input
                      type="date"
                      required
                      value={newAsset.datePlacedInService}
                      onChange={(e) => setNewAsset({ ...newAsset, datePlacedInService: e.target.value })}
                      className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Cost Basis ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newAsset.costBasis || ''}
                      onChange={(e) => setNewAsset({ ...newAsset, costBasis: parseFloat(e.target.value) })}
                      className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Business Use (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newAsset.businessUsePercent || 100}
                      onChange={(e) => setNewAsset({ ...newAsset, businessUsePercent: parseFloat(e.target.value) })}
                      className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Depreciation Method
                    </label>
                    <select
                      value={newAsset.depreciationMethod}
                      onChange={(e) => setNewAsset({ ...newAsset, depreciationMethod: e.target.value as any })}
                      className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="MACRS_200_DB">MACRS 200% DB</option>
                      <option value="MACRS_150_DB">MACRS 150% DB</option>
                      <option value="SECTION_179">Section 179 (Full)</option>
                      <option value="STRAIGHT_LINE">Straight Line</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Recovery Period
                    </label>
                    <select
                      value={newAsset.recoveryPeriodYears}
                      onChange={(e) => setNewAsset({ ...newAsset, recoveryPeriodYears: parseFloat(e.target.value) })}
                      className="w-full glass-input px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value={3}>3 Years</option>
                      <option value={5}>5 Years</option>
                      <option value={7}>7 Years</option>
                      <option value={15}>15 Years</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsAddDrawerOpen(false)} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow">
                    Save Asset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Year-by-Year Depreciation Grid Slide-Over Drawer */}
      {selectedAssetSchedule && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedAssetSchedule(null)} />
          <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex pl-0 sm:pl-10">
            <div className="w-full glass-panel bg-white/95 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between p-6 space-y-4 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Multi-Year Schedule: {selectedAssetSchedule.assetName}
                </h3>
                <button onClick={() => setSelectedAssetSchedule(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const sched = calculateAssetDepreciationSchedule(selectedAssetSchedule, 2026);
                return (
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Year</th>
                          <th className="py-2.5 px-3 text-right">Beg. Basis</th>
                          <th className="py-2.5 px-3 text-right">Sec 179</th>
                          <th className="py-2.5 px-3 text-right">Depreciation</th>
                          <th className="py-2.5 px-3 text-right">Ending Basis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {sched.yearByYear.map((y) => (
                          <tr key={y.year} className={y.year === 2026 ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-bold' : ''}>
                            <td className="py-2.5 px-3 font-sans">{y.year}</td>
                            <td className="py-2.5 px-3 text-right">${y.beginningBasis.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right">${y.section179Deduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">${y.totalAnnualDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right">${y.endingBasis.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAssetSchedule(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Close Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
