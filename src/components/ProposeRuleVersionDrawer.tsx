import React from 'react';
import { AlertCircle, X } from 'lucide-react';
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
  error?: string | null;
  onDismissError?: () => void;
}

export const ProposeRuleVersionDrawer: React.FC<ProposeRuleVersionDrawerProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  error,
  onDismissError,
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
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Propose New Tax Rule Version</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start justify-between gap-2 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {onDismissError && (
                <button
                  type="button"
                  onClick={onDismissError}
                  className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3 text-xs flex-1">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Source Title *</label>
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
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Source URL *</label>
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
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Publisher *</label>
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
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Statute Reference / Regulation *</label>
              <input
                type="text"
                required
                value={formData.statuteReference}
                onChange={(e) => setFormData({ ...formData, statuteReference: e.target.value })}
                placeholder="e.g. 72 P.S. § 7302 / Act 32"
                className="w-full glass-input p-2.5 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Tax Rate / Rule Value *</label>
              <input
                type="text"
                required
                value={formData.rateValue}
                onChange={(e) => setFormData({ ...formData, rateValue: e.target.value })}
                placeholder="e.g. 0.0307"
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
