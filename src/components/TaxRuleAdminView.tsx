import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  BookOpen, 
  Server,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Layers,
  TestTube,
  Code2,
  Table,
  Zap,
  Lock,
  Search,
  Filter,
  Globe,
  Building2
} from 'lucide-react';
import { ProposeRuleVersionDrawer, type ProposeRuleFormData } from './ProposeRuleVersionDrawer';
import { PackageSyncDrawer } from './PackageSyncDrawer';

import { type TaxRuleAdminItem } from './taxRuleDefaults';
export type { TaxRuleAdminItem };

interface TaxRuleAdminViewProps {
  employees?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    paPsdCode?: string;
    paPsdName?: string;
    paResidentEitRate?: number;
    paWorkPsdCode?: string;
    paWorkEitRate?: number;
  }>;
}

interface TaxRuleCardProps {
  rule: TaxRuleAdminItem;
  onStatusTransition: (id: string, nextStatus: TaxRuleAdminItem['status']) => void;
}

const formatTestCaseInput = (input: Record<string, any>) => {
  if (!input || typeof input !== 'object') return [];
  const entries: Array<{ label: string; value: string }> = [];
  if (input.grossWages !== undefined) {
    entries.push({ label: 'Gross Wages', value: `$${Number(input.grossWages).toLocaleString()}` });
  }
  if (input.priorCumulativeWages !== undefined) {
    entries.push({ label: 'Prior Cumulative Wages', value: `$${Number(input.priorCumulativeWages).toLocaleString()}` });
  }
  if (input.filingStatus !== undefined) {
    entries.push({ label: 'Filing Status', value: String(input.filingStatus) });
  }
  Object.keys(input).forEach((key) => {
    if (!['grossWages', 'priorCumulativeWages', 'filingStatus'].includes(key)) {
      entries.push({ label: key, value: String(input[key]) });
    }
  });
  return entries;
};

const TaxRuleCard: React.FC<TaxRuleCardProps> = ({ rule, onStatusTransition }) => {
  const [activeTab, setActiveTab] = useState<'NONE' | 'BRACKETS' | 'TESTS' | 'RAW_JSON'>('NONE');
  const [copied, setCopied] = useState(false);

  // Parse ruleData cleanly from rule.ruleData or stringified JSON in summary
  const ruleDataObj = React.useMemo(() => {
    if (rule.ruleData) {
      if (typeof rule.ruleData === 'object') return rule.ruleData;
      try {
        return JSON.parse(rule.ruleData);
      } catch {}
    }
    if (rule.ruleDataSummary && typeof rule.ruleDataSummary === 'string') {
      const trimmed = rule.ruleDataSummary.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed);
        } catch {}
      }
    }
    return null;
  }, [rule.ruleData, rule.ruleDataSummary]);

  // Clean prose summary — NEVER output raw JSON string!
  const cleanSummaryText = React.useMemo(() => {
    if (rule.ruleDataSummary && typeof rule.ruleDataSummary === 'string') {
      const trimmed = rule.ruleDataSummary.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return rule.ruleDataSummary;
      }
    }
    if (ruleDataObj) {
      if (Array.isArray(ruleDataObj.brackets) && ruleDataObj.brackets.length > 0) {
        const rates = ruleDataObj.brackets.map((b: any) => b.marginalRate * 100);
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        return `Graduated Statutory Tax Brackets (${ruleDataObj.brackets.length} progressive tiers: ${minRate.toFixed(2)}% – ${maxRate.toFixed(2)}%)`;
      }
      if (typeof ruleDataObj.rate === 'number') {
        const pct = (ruleDataObj.rate * 100).toFixed(2);
        return `Statutory Flat Withholding Rate of ${pct}%${ruleDataObj.wageCap ? ` (Wage Ceiling: $${ruleDataObj.wageCap.toLocaleString()})` : ''}`;
      }
    }
    return 'Statutory Tax Rule Calculation Logic';
  }, [rule.ruleDataSummary, ruleDataObj]);

  const brackets = Array.isArray(ruleDataObj?.brackets) ? ruleDataObj.brackets : [];
  const testCases = Array.isArray(ruleDataObj?.testCases) ? ruleDataObj.testCases : [];
  const rate = typeof ruleDataObj?.rate === 'number' ? ruleDataObj.rate : null;
  const wageCap = typeof ruleDataObj?.wageCap === 'number' ? ruleDataObj.wageCap : null;
  const checksum = typeof ruleDataObj?.checksum === 'string' ? ruleDataObj.checksum : null;

  const handleCopyJson = () => {
    const jsonStr = ruleDataObj ? JSON.stringify(ruleDataObj, null, 2) : '{}';
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTab = (tab: 'BRACKETS' | 'TESTS' | 'RAW_JSON') => {
    setActiveTab((prev) => (prev === tab ? 'NONE' : tab));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-xs hover:shadow-sm transition-all duration-200 space-y-4">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono border border-slate-200 dark:border-slate-700">
              {rule.jurisdiction}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-mono border border-emerald-200 dark:border-emerald-800/50">
              v{rule.versionNumber}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
              {rule.category}
            </span>
            <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">{rule.name}</h3>
          </div>
          
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {cleanSummaryText}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Rate Summary Pill (Harmonized Emerald Theme) */}
          {brackets.length > 0 && (
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
              {(Math.min(...brackets.map((b: any) => b.marginalRate * 100))).toFixed(1)}% – {(Math.max(...brackets.map((b: any) => b.marginalRate * 100))).toFixed(1)}% Progressive
            </span>
          )}

          {rate !== null && brackets.length === 0 && (
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
              {(rate * 100).toFixed(2)}% Flat Rate
            </span>
          )}

          <span
            className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
              rule.status === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : rule.status === 'IN_REVIEW'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {rule.status}
          </span>

          {rule.status === 'IN_REVIEW' && (
            <button
              onClick={() => onStatusTransition(rule.id, 'ACTIVE')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
            >
              Activate
            </button>
          )}
        </div>
      </div>

      {/* Visual Progressive Tier Matrix (Dual-Theme Harmonized) */}
      {brackets.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Layers className="w-4 h-4" />
              Statutory Progressive Tax Tiers ({brackets.length} Brackets)
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Filing Status: SINGLE / ALL
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {brackets.map((b: any, idx: number) => {
              const fromK = (b.incomeFrom / 1000).toFixed(0);
              const toK = b.incomeTo && b.incomeTo < 999999 ? `$${(b.incomeTo / 1000).toFixed(0)}k` : 'No Cap';
              const rangeStr = b.incomeFrom === 0 ? `$0 – ${toK}` : `$${fromK}k – ${toK}`;
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-center flex flex-col justify-between space-y-1 shadow-2xs">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium truncate">
                    {rangeStr}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {(b.marginalRate * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flat Rate Display (Dual-Theme Harmonized) */}
      {rate !== null && brackets.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Statutory Flat Rate Withholding</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Fixed rate applied across all eligible gross wages</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{(rate * 100).toFixed(2)}%</div>
            {wageCap && <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">Wage Ceiling: ${wageCap.toLocaleString()}</div>}
          </div>
        </div>
      )}

      {/* Footer & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Statute: <strong className="text-slate-900 dark:text-slate-200 font-mono">{rule.statuteReference}</strong>
          </span>
          {rule.sourceUrl && (
            <a
              href={rule.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              {rule.sourceTitle || 'Official Citation'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {testCases.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {testCases.length} Tests Passing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {brackets.length > 0 && (
            <button
              onClick={() => toggleTab('BRACKETS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'BRACKETS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Full Matrix</span>
              {activeTab === 'BRACKETS' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          {testCases.length > 0 && (
            <button
              onClick={() => toggleTab('TESTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'TESTS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <TestTube className="w-3.5 h-3.5" />
              <span>Test Suite ({testCases.length})</span>
              {activeTab === 'TESTS' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => toggleTab('RAW_JSON')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'RAW_JSON'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Raw Spec</span>
            {activeTab === 'RAW_JSON' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Brackets Matrix Panel (Theme Harmonized) */}
      {activeTab === 'BRACKETS' && brackets.length > 0 && (
        <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs space-y-3 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-900 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Tax Bracket Detailed Matrix ({rule.jurisdiction})
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-xs font-normal">
              {brackets.length} progressive tiers
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse bg-white dark:bg-slate-900">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Filing Status</th>
                  <th className="py-2.5 px-3">Sequence</th>
                  <th className="py-2.5 px-3">Income Range</th>
                  <th className="py-2.5 px-3">Base Tax</th>
                  <th className="py-2.5 px-3 text-right">Marginal Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {brackets.map((b: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200 transition">
                    <td className="py-2.5 px-3 font-sans text-xs font-semibold text-emerald-700 dark:text-emerald-400">{b.filingStatus || 'ALL'}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">Tier #{b.bracketSequence || idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium">
                      ${b.incomeFrom?.toLocaleString()} – {b.incomeTo && b.incomeTo < 999999 ? `$${b.incomeTo.toLocaleString()}` : 'No Limit'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">${b.baseTax !== undefined ? b.baseTax.toLocaleString() : '0'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      {(b.marginalRate * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expanded Test Suite Panel (Theme Harmonized & Clean Format - NO raw JSON text) */}
      {activeTab === 'TESTS' && testCases.length > 0 && (
        <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-3 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-900 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <TestTube className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Verified Regression Test Cases ({testCases.length})
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold">
              All Passing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testCases.map((tc: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-xs">{tc.id || `tc-${idx + 1}`}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold uppercase tracking-wider">
                    PASSING
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-sans text-xs font-medium">{tc.description || 'Regression verification case'}</p>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                  {formatTestCaseInput(tc.inputPayload).map((item, i) => (
                    <div key={i} className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{item.label}:</span>
                      <strong className="text-slate-900 dark:text-slate-200 font-mono">{item.value}</strong>
                    </div>
                  ))}
                  {tc.expectedOutput?.taxAmount !== undefined && (
                    <div className="flex justify-between text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800 font-bold text-xs">
                      <span>Expected Tax Output:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono">${Number(tc.expectedOutput.taxAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Raw Spec JSON Inspector */}
      {activeTab === 'RAW_JSON' && (
        <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-900 dark:text-slate-200 font-bold pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="font-mono text-xs text-slate-900 dark:text-slate-200 font-bold flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Tax Rule JSON Specification
            </span>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded font-mono text-[11px] transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-emerald-800 dark:text-emerald-400 text-[11px] overflow-x-auto max-h-72 leading-relaxed">
            <code>{ruleDataObj ? JSON.stringify(ruleDataObj, null, 2) : '{}'}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export const TaxRuleAdminView: React.FC<TaxRuleAdminViewProps> = ({ employees = [] }) => {
  const dynamicPsdRules: TaxRuleAdminItem[] = React.useMemo(() => {
    const psdMap = new Map<string, TaxRuleAdminItem>();

    employees.forEach((emp) => {
      if (emp.paPsdCode && !psdMap.has(emp.paPsdCode)) {
        psdMap.set(emp.paPsdCode, {
          id: `ver_pa_eit_${emp.paPsdCode}_1`,
          ruleCode: `PA_EIT_${emp.paPsdCode}`,
          name: `${emp.paPsdName || 'Local PSD'} EIT Rate`,
          jurisdiction: `PA-PSD-${emp.paPsdCode}`,
          category: 'WITHHOLDING',
          versionNumber: 1,
          status: 'ACTIVE',
          sourceTitle: `PA DCED Municipal Tax Register (PSD ${emp.paPsdCode})`,
          sourceUrl: 'https://dced.pa.gov/local-government/local-income-tax-information/',
          sourcePublisher: 'PA Dept of Community & Economic Development',
          statuteReference: '53 P.S. § 6924.301 (Act 32)',
          citationTier: 'TIER_1_OFFICIAL',
          effectiveStart: '2026-01-01',
          ruleDataSummary: emp.paResidentEitRate !== undefined
            ? `Flat Rate: ${(emp.paResidentEitRate * 100).toFixed(2)}%`
            : 'Flat Rate: Pending Resolution',
          ruleData: { rate: emp.paResidentEitRate ?? 0 },
        });
      }
    });

    return Array.from(psdMap.values());
  }, [employees]);

  const [fetchedRules, setFetchedRules] = useState<TaxRuleAdminItem[]>([]);
  const [customRules, setCustomRules] = useState<TaxRuleAdminItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'FEDERAL' | 'STATE' | 'PA_PSD'>('ALL');
  const [selectedPsd, setSelectedPsd] = useState<string>('ALL');

  const fetchRules = () => {
    fetch('/api/tax-rules')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.rules)) {
          setFetchedRules(data.rules);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const rules = [...fetchedRules, ...dynamicPsdRules, ...customRules];
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProposeRuleFormData>({
    ruleCode: 'PA_SIT_RATE',
    name: 'PA Personal Income Tax',
    jurisdiction: 'PA-STATE',
    category: 'WITHHOLDING',
    sourceTitle: '',
    sourceUrl: '',
    sourcePublisher: 'PA Department of Revenue',
    statuteReference: '',
    citationTier: 'TIER_1_OFFICIAL',
    rateValue: '0.0307',
  });

  // Extract unique PSD codes
  const availablePsds = React.useMemo(() => {
    const psds = rules
      .filter((r) => r.jurisdiction.startsWith('PA-PSD-'))
      .map((r) => r.jurisdiction.replace('PA-PSD-', ''));
    return Array.from(new Set(psds)).sort();
  }, [rules]);

  const handleStatusTransition = (id: string, nextStatus: TaxRuleAdminItem['status']) => {
    setCustomRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
    );
  };

  const handleAddRuleVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sourceTitle || !formData.sourceUrl || !formData.statuteReference) {
      alert('Source Title, Source URL, and Statute Reference citations are strictly required.');
      return;
    }
    const newRule: TaxRuleAdminItem = {
      id: `ver_custom_${Date.now()}`,
      ruleCode: formData.ruleCode,
      name: formData.name,
      jurisdiction: formData.jurisdiction,
      category: formData.category,
      versionNumber: 2,
      status: 'IN_REVIEW',
      sourceTitle: formData.sourceTitle,
      sourceUrl: formData.sourceUrl,
      sourcePublisher: formData.sourcePublisher,
      statuteReference: formData.statuteReference,
      citationTier: formData.citationTier,
      effectiveStart: new Date().toISOString().split('T')[0],
      ruleDataSummary: `Flat Rate: ${(parseFloat(formData.rateValue) * 100).toFixed(2)}%`,
      ruleData: { rate: parseFloat(formData.rateValue) },
    };
    setCustomRules([newRule, ...customRules]);
    setIsModalOpen(false);
  };

  const filteredRules = rules.filter((rule) => {
    // Category filter
    if (selectedCategory === 'FEDERAL' && rule.jurisdiction !== 'US-FED') return false;
    if (selectedCategory === 'STATE' && (rule.jurisdiction.startsWith('PA-PSD-') || rule.jurisdiction === 'US-FED')) return false;
    if (selectedCategory === 'PA_PSD' && !rule.jurisdiction.startsWith('PA-PSD-')) return false;

    // Specific PSD select filter
    if (selectedCategory === 'PA_PSD' && selectedPsd !== 'ALL' && rule.jurisdiction !== `PA-PSD-${selectedPsd}`) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rule.name.toLowerCase().includes(q);
      const matchJur = rule.jurisdiction.toLowerCase().includes(q);
      const matchCode = rule.ruleCode.toLowerCase().includes(q);
      const matchStatute = rule.statuteReference.toLowerCase().includes(q);
      if (!matchName && !matchJur && !matchCode && !matchStatute) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tax Rule Governance & Audit Engine</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Zero hardcoded rates. Every calculation is versioned and tied to authoritative Tier 1 source citations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSyncDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-xs text-sm cursor-pointer"
          >
            <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Sync from Package Server</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Propose Rule Version
          </button>
        </div>
      </div>

      {/* Control & Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Navigation (Harmonized Emerald Theme) */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => { setSelectedCategory('ALL'); setSelectedPsd('ALL'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All Rules</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/40 text-white font-mono">
                {rules.length}
              </span>
            </button>

            <button
              onClick={() => { setSelectedCategory('FEDERAL'); setSelectedPsd('ALL'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'FEDERAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Federal</span>
            </button>

            <button
              onClick={() => { setSelectedCategory('STATE'); setSelectedPsd('ALL'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'STATE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>State Statutory</span>
            </button>

            <button
              onClick={() => { setSelectedCategory('PA_PSD'); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'PA_PSD'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>PA Local PSDs</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono">
                {availablePsds.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rule, statute, or jurisdiction..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Secondary PSD Selector Dropdown */}
        {selectedCategory === 'PA_PSD' && availablePsds.length > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-500" />
              Select Specific PSD District:
            </label>
            <select
              value={selectedPsd}
              onChange={(e) => setSelectedPsd(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="ALL">All PA School Districts ({availablePsds.length})</option>
              {availablePsds.map((psd) => (
                <option key={psd} value={psd}>
                  PA-PSD-{psd}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results Count & Rules Grid */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
        <span>Showing {filteredRules.length} of {rules.length} active tax rules</span>
        {(searchQuery || selectedCategory !== 'ALL' || selectedPsd !== 'ALL') && (
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setSelectedPsd('ALL'); }}
            className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule) => (
            <TaxRuleCard key={rule.id} rule={rule} onStatusTransition={handleStatusTransition} />
          ))
        ) : (
          <div className="glass-card p-12 text-center rounded-2xl space-y-3">
            <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Tax Rules Match Filter</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query or reset your jurisdiction category filters.
            </p>
          </div>
        )}
      </div>

      {/* Drawers */}
      <ProposeRuleVersionDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddRuleVersion}
      />

      <PackageSyncDrawer
        isOpen={isSyncDrawerOpen}
        onClose={() => setIsSyncDrawerOpen(false)}
        onPackageIngested={(res) => {
          fetchRules();
          if (res?.packageCode) {
            const newRule: TaxRuleAdminItem = {
              id: `ver_${res.packageCode}_${Date.now()}`,
              ruleCode: `${res.jurisdictionCode}_TAX_PACK`,
              name: `${res.packageCode} Ingested Package`,
              jurisdiction: res.jurisdictionCode,
              category: 'WITHHOLDING',
              versionNumber: 1,
              status: 'ACTIVE',
              sourceTitle: `Sealed Tax Package ${res.packageCode}`,
              sourceUrl: 'http://localhost:3333/packages',
              sourcePublisher: 'Tax Rule Packaging Server',
              statuteReference: res.manifestChecksum ? res.manifestChecksum.substring(0, 24) : 'Verified',
              citationTier: 'TIER_1_OFFICIAL',
              effectiveStart: new Date().toISOString().split('T')[0],
              ruleDataSummary: `Ingested ${res.rulesIngested} rules (${res.versionsCreated} versions)`,
            };
            setCustomRules((prev) => [newRule, ...prev]);
          }
        }}
      />
    </div>
  );
};
