import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, ShieldCheck, UserPlus, Users, ExternalLink, RefreshCw } from 'lucide-react';
import { generateW9TokenPair } from 'taxshield-ledger-core';
import { ContractorDetailsCard } from './ContractorDetailsCard';
import { NewContractorForm, NewContractorInput } from './NewContractorForm';

export interface ContractorOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string | null;
  tinMasked?: string | null;
  taxClassification?: string | null;
  hasCertifiedW9: boolean;
  ytdTotalPaid?: number;
}

export interface W9InviteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contractors: ContractorOption[];
  initialContractorId?: string;
  initialMode?: 'new' | 'existing';
  companyName?: string;
  onInviteGenerated: (contractorId: string, tokenHash: string) => void;
  onAddContractor?: (contractor: NewContractorInput) => string;
}

interface ActiveSummary {
  name: string;
  email: string;
  businessName?: string;
}

/**
 * Slide-over drawer for adding contractor details and issuing single-use tokenized Form W-9 onboarding invites.
 */
export function W9InviteDrawer({
  isOpen,
  onClose,
  contractors,
  initialContractorId,
  initialMode,
  companyName = 'Micro-LLC Client',
  onInviteGenerated,
  onAddContractor,
}: W9InviteDrawerProps) {
  const hasExisting = contractors.length > 0;
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSummary, setActiveSummary] = useState<ActiveSummary | null>(null);

  useEffect(() => {
    if (isOpen) {
      const targetMode = initialMode ? initialMode : hasExisting ? 'existing' : 'new';
      setMode(targetMode);
      setSelectedContractorId(initialContractorId || contractors[0]?.id || '');
      setInviteUrl(null);
      setCopied(false);
      setActiveSummary(null);
    }
  }, [isOpen, initialContractorId, initialMode, hasExisting, contractors]);

  if (!isOpen) return null;

  const selectedContractor = contractors.find((c) => c.id === selectedContractorId) || contractors[0];

  const buildInviteLink = (rawToken: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    return `${origin}/onboard/w9?token=${rawToken}`;
  };

  const syncBackendInvite = (empId: string, name: string) => {
    fetch('/api/contractors/invite-w9', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: empId, contractorName: name, companyName }),
    }).catch(() => {
      // Backend sync fallback for standalone/offline mode
    });
  };

  const handleGenerateExisting = () => {
    if (!selectedContractor) return;
    const { rawToken, tokenHash } = generateW9TokenPair();
    onInviteGenerated(selectedContractor.id, tokenHash);
    syncBackendInvite(selectedContractor.id, selectedContractor.name);

    setActiveSummary({
      name: selectedContractor.name,
      email: selectedContractor.email,
      businessName: selectedContractor.businessName || undefined,
    });
    setInviteUrl(buildInviteLink(rawToken));
  };

  const handleAddNewContractor = (input: NewContractorInput) => {
    const contractorId = onAddContractor ? onAddContractor(input) : `contractor_${Date.now()}`;
    const fullName = `${input.firstName} ${input.lastName}`;
    const { rawToken, tokenHash } = generateW9TokenPair();
    onInviteGenerated(contractorId, tokenHash);
    syncBackendInvite(contractorId, fullName);

    setActiveSummary({
      name: fullName,
      email: input.email,
      businessName: input.businessName,
    });
    setInviteUrl(buildInviteLink(rawToken));
  };

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-lg animate-in slide-in-from-right duration-300">
          <div className="flex h-full flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Form W-9 Invitation</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Secure Tokenized Contractor Onboarding</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            {!inviteUrl && (
              <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setMode('new')}
                    className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                      mode === 'new'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add New Contractor
                  </button>
                  <button
                    type="button"
                    onClick={() => hasExisting && setMode('existing')}
                    disabled={!hasExisting}
                    className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                      mode === 'existing'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : !hasExisting
                        ? 'border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Select Existing ({contractors.length})
                  </button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {!inviteUrl ? (
                <>
                  {mode === 'new' ? (
                    <NewContractorForm onSubmit={handleAddNewContractor} />
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Select Contractor from Roster
                        </label>
                        <select
                          value={selectedContractorId}
                          onChange={(e) => setSelectedContractorId(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          {contractors.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.email}) {c.hasCertifiedW9 ? '✓ W-9 Certified' : '• Missing W-9'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedContractor && (
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Contractor Profile Details
                          </p>
                          <ContractorDetailsCard contractor={selectedContractor} />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleGenerateExisting}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Generate Secure Invite Link
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Form W-9 Onboarding Link Ready
                    </p>
                    {activeSummary && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                        Created for: <span className="font-semibold">{activeSummary.name}</span> ({activeSummary.email})
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Single-Use 7-Day Link
                    </p>
                    <p className="text-xs font-mono break-all text-slate-800 dark:text-slate-200 select-all p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      {inviteUrl}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied to Clipboard!' : 'Copy Invitation Link'}
                    </button>
                    <a
                      href={inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Preview Form W-9 As Contractor
                    </a>
                    <button
                      type="button"
                      onClick={() => setInviteUrl(null)}
                      className="w-full py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Invite another contractor
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
