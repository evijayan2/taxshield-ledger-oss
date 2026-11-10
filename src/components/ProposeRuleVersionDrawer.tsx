import React from 'react';
import type { TaxRuleAdminItem } from './TaxRuleAdminView';

export interface ProposeRuleFormData {
  ruleCode: string;
  name: string;
  jurisdiction: string;
  category: string;
  rateValue: string;
  sourceTitle: string;
  sourceUrl: string;
  sourcePublisher: string;
  statuteReference: string;
  citationTier: 'TIER_1_OFFICIAL' | 'TIER_2_GOV_DEPT' | 'TIER_3_THIRD_PARTY';
}

export interface ProposeRuleVersionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ProposeRuleFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProposeRuleFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProposeRuleVersionDrawer: React.FC<ProposeRuleVersionDrawerProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-lg w-full flex pl-0 sm:pl-10">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Propose New Tax Rule Version</h2>
          <form onSubmit={onSubmit} className="space-y-3 text-xs flex-1">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Source Title *</label>
              <input
                type="text"
                required
                value={formData.sourceTitle}
                onChange={(e) => setFormData({ ...formData, sourceTitle: e.target.value })}
                placeholder="e.g. PA Dept of Revenue PIT Release 2026"
                className="w-full glass-input p-2.5 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Source URL *</label>
              <input
                type="url"
                required
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://..."
                className="w-full glass-input p-2.5 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Publisher *</label>
              <input
                type="text"
                required
                value={formData.sourcePublisher}
                onChange={(e) => setFormData({ ...formData, sourcePublisher: e.target.value })}
                placeholder="e.g. PA Dept of Revenue"
                className="w-full glass-input p-2.5 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Tax Rate / Rule Value *</label>
              <input
                type="text"
                required
                value={formData.rateValue}
                onChange={(e) => setFormData({ ...formData, rateValue: e.target.value })}
                placeholder="Enter the cited rate"
                className="w-full glass-input p-2.5 rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer"
              >
                Submit Version
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
