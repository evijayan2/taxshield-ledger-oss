import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  X, 
  Building2, 
  User, 
  CheckCircle2, 
  Printer, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Organization, Employee, PayStub } from '../types';
import { 
  calculateW2Summaries, 
  calculateW3Summary, 
  W2EmployeeSummary, 
  W3TransmittalSummary, 
  formatCurrency 
} from '../utils/w2w3Data';
import { 
  generateW2Pdf, 
  generateW3Pdf, 
  generateW2W3BundlePdf, 
  downloadPdfDocument 
} from '../utils/w2w3PdfBuilder';

interface W2W3PreviewModalProps {
  org: Organization;
  employees: Employee[];
  payStubs: PayStub[];
  onClose: () => void;
}

export function W2W3PreviewModal({ org, employees, payStubs, onClose }: W2W3PreviewModalProps) {
  const w2List = calculateW2Summaries(org, employees, payStubs);
  const w3Summary = calculateW3Summary(org, w2List);

  const [activeTab, setActiveTab] = useState<string>(w2List[0]?.employeeId || 'W3_SUMMARY');

  const selectedW2 = w2List.find(w => w.employeeId === activeTab);
  const isW3Active = activeTab === 'W3_SUMMARY';

  const handleDownloadSingleW2 = (w2: W2EmployeeSummary) => {
    const doc = generateW2Pdf(w2, org);
    downloadPdfDocument(doc, `Form_W2_${w2.employeeLastName}_${org.name.replace(/\s+/g, '_')}_2026.pdf`);
  };

  const handleDownloadW3 = () => {
    const doc = generateW3Pdf(w3Summary, org);
    downloadPdfDocument(doc, `Form_W3_Transmittal_${org.name.replace(/\s+/g, '_')}_2026.pdf`);
  };

  const handleDownloadBundle = () => {
    const doc = generateW2W3BundlePdf(org, w2List, w3Summary);
    downloadPdfDocument(doc, `Complete_IRS_W2_W3_Package_${org.name.replace(/\s+/g, '_')}_2026.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-4xl w-full flex">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto flex flex-col h-full animate-in slide-in-from-right duration-300 p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">IRS Form W-2 & W-3 PDF Generator</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                  3rd Party Tax Systems Readable
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Formatted vector PDF templates for TurboTax, H&R Block, CPA suites & SSA/IRS filing.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold rounded-lg cursor-pointer self-start sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Action Banner */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Generated {w2List.length} Form W-2(s) and 1 Form W-3 Transmittal for tax year 2026.
            </span>
          </div>

          <button
            onClick={handleDownloadBundle}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-2 shadow-md shadow-emerald-700/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Complete Package (W-3 + All W-2s PDF)</span>
          </button>
        </div>

        {/* Form Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('W3_SUMMARY')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition shrink-0 flex items-center gap-2 cursor-pointer ${
              isW3Active
                ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Form W-3 Transmittal (Employer)</span>
          </button>

          {w2List.map(w2 => (
            <button
              key={w2.employeeId}
              onClick={() => setActiveTab(w2.employeeId)}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === w2.employeeId
                  ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Form W-2: {w2.employeeName}</span>
            </button>
          ))}
        </div>

        {/* Main Form Display */}
        {isW3Active ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Form W-3 Transmittal Summary</h4>
              <button
                onClick={handleDownloadW3}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Form W-3 PDF</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div><span className="text-slate-400 block text-[10px]">Employer EIN</span><strong className="font-mono text-slate-800 dark:text-slate-200">{w3Summary.employerEin}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Total W-2 Statements</span><strong className="font-mono text-slate-800 dark:text-slate-200">{w3Summary.totalFormsW2}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Box 1 Total Wages</span><strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(w3Summary.totalBox1Wages)}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Box 2 Total Fed Tax</span><strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(w3Summary.totalBox2FedTax)}</strong></div>
            </div>
          </div>
        ) : selectedW2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Wage & Tax Statement (Form W-2: {selectedW2.employeeName})</h4>
              <button
                onClick={() => handleDownloadSingleW2(selectedW2)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download W-2 PDF (Copy B & C)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div><span className="text-slate-400 block text-[10px]">Employee SSN</span><strong className="font-mono text-slate-800 dark:text-slate-200">{selectedW2.employeeSsn}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Box 1 Federal Wages</span><strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedW2.boxes.box1Wages)}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Box 2 Federal Tax</span><strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedW2.boxes.box2FedTax)}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Box 14 Other (PA LST)</span><strong className="font-mono text-emerald-600 dark:text-emerald-400">{selectedW2.boxes.box14Other || 'None'}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Box 16 PA State Wages</span><strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedW2.boxes.box16StateWages)}</strong></div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  </div>
);
}
