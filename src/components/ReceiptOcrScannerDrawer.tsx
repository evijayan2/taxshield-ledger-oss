import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Receipt,
  Lock
} from 'lucide-react';
import { GeneralExpense, ExtractedReceiptResult, GeneralExpenseCategory, parseReceiptText } from 'taxshield-ledger-core';
import { isFutureYear, isFutureDateString } from '../utils/taxEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExpense: (expense: Omit<GeneralExpense, 'id' | 'createdAt'>) => void;
  activeTaxYear?: number;
}

const SCHEDULE_C_OPTIONS = [
  { line: 'Line 8 - Advertising', category: 'MARKETING' },
  { line: 'Line 10 - Commissions & Fees', category: 'BANK_FEES' },
  { line: 'Line 17 - Legal & Professional Services', category: 'LEGAL_ACCOUNTING' },
  { line: 'Line 18 - Office Expense', category: 'OFFICE_SUPPLIES' },
  { line: 'Line 20b - Rent/Lease (Other)', category: 'RENT_LEASE' },
  { line: 'Line 25 - Utilities / Phone / Internet', category: 'PHONE_INTERNET' },
  { line: 'Line 27a - Software & Technology Tools', category: 'SOFTWARE_TECH' },
  { line: 'Line 27a - Other Expenses', category: 'OTHER' },
];

/**
 * Slide-Over Drawer for scanning receipts via OCR with mandatory user confirmation.
 */
export const ReceiptOcrScannerDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirmExpense,
  activeTaxYear = 2026,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ExtractedReceiptResult | null>(null);
  const [rawTextPaste, setRawTextPaste] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [ocrStatus, setOcrStatus] = useState<string>('');

  // Form Fields for Confirmation
  const [payee, setPayee] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<GeneralExpenseCategory>('OFFICE_SUPPLIES');
  const [scheduleCLine, setScheduleCLine] = useState('Line 18 - Office Expense');
  const [paidBy, setPaidBy] = useState<'LLC_ACCOUNT' | 'OWNER_PERSONAL'>('LLC_ACCOUNT');
  const [description, setDescription] = useState('');
  const [isDeductible, setIsDeductible] = useState(true);

  if (!isOpen) return null;

  const isFutureActiveYear = isFutureYear(activeTaxYear);
  const isSelectedDateFuture = isFutureDateString(expenseDate);

  const populateFieldsFromResult = (result: ExtractedReceiptResult) => {
    setScanResult(result);
    setPayee(result.vendor.value || '');
    setExpenseDate(result.date.value || `${activeTaxYear}-01-15`);
    setAmount(result.totalAmount.value !== null ? String(result.totalAmount.value) : '');
    const detectedCat = (result.suggestedCategory.value || 'OFFICE_SUPPLIES') as GeneralExpenseCategory;
    setCategory(detectedCat);
    const matchedOption = SCHEDULE_C_OPTIONS.find(o => o.category === detectedCat);
    setScheduleCLine(matchedOption ? matchedOption.line : 'Line 18 - Office Expense');
    const isRefund = result.notes?.includes('refund') || /return|refund/i.test(result.rawExtractedText || '');
    setDescription(`[OCR Scanned${isRefund ? ' - Return/Refund' : ''}] Vendor: ${result.vendor.value || 'Unknown'}`);
  };

  const handleProcessScan = async (textToScan: string, fName: string, fileDataUri?: string) => {
    setIsScanning(true);
    setError(null);
    try {
      // 1. Direct local engine parse: guarantees instant, offline-capable, and latest rules
      const localResult = parseReceiptText(textToScan, { fileName: fName, fileUrl: fileDataUri });
      populateFieldsFromResult(localResult);

      // 2. Also sync to backend API endpoint asynchronously
      fetch('/api/expenses/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: textToScan, fileName: fName, fileUrl: fileDataUri }),
      }).catch(() => {});
    } catch (err: any) {
      console.warn('Receipt extraction error:', err);
      setError('Could not automatically parse receipt fields. Please review and fill in manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const fileDataUri = reader.result as string;
      setPreviewUrl(fileDataUri);
      if (file.type.startsWith('image/')) {
        setIsScanning(true);
        setError(null);
        setOcrStatus('Starting OCR engine...');
        try {
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('eng');
          setOcrStatus('Recognizing receipt text...');
          const ret = await worker.recognize(fileDataUri);
          const extractedText = ret.data.text;
          await worker.terminate();

          if (!extractedText || !extractedText.trim()) {
            throw new Error('No legible text detected on this image.');
          }

          setOcrStatus('Parsing financial fields...');
          await handleProcessScan(extractedText, file.name, fileDataUri);
        } catch (ocrErr: any) {
          console.warn('Browser OCR failed, attempting server scan:', ocrErr);
          setOcrStatus('Attempting server OCR scan...');
          try {
            const resp = await fetch('/api/expenses/scan-receipt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileUrl: fileDataUri, fileName: file.name }),
            });
            if (resp.ok) {
              const body = await resp.json();
              if (body.success && body.result && (body.result.totalAmount.value !== null || body.result.vendor.value)) {
                populateFieldsFromResult(body.result);
                return;
              }
            }
          } catch {
            // ignore
          }

          setError('OCR could not detect all fields automatically. Please verify or fill in the details below.');
          populateFieldsFromResult({
            scanId: `scan_${Date.now()}`,
            status: 'unconfirmed',
            vendor: { value: '', confidence: 'low' },
            date: { value: `${activeTaxYear}-01-15`, confidence: 'low' },
            totalAmount: { value: null, confidence: 'low' },
            suggestedCategory: { value: 'OFFICE_SUPPLIES', confidence: 'low' },
            suggestedScheduleCLine: { value: 'Line 18 - Office Expense', confidence: 'low' },
            receiptFileName: file.name,
            receiptFileUrl: fileDataUri,
            createdAt: new Date().toISOString(),
          });
        } finally {
          setIsScanning(false);
          setOcrStatus('');
        }
      } else {
        const textContent = await file.text();
        await handleProcessScan(textContent, file.name, fileDataUri);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payee || !amount || isNaN(Number(amount))) return;
    if (isFutureActiveYear || isSelectedDateFuture) return;

    onConfirmExpense({
      expenseDate,
      payee,
      category,
      scheduleCLine,
      description,
      amount: parseFloat(amount),
      paidBy,
      isTaxDeductible: isDeductible,
      receiptUrl: previewUrl || undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setScanResult(null);
    setPreviewUrl(null);
    setRawTextPaste('');
    setError(null);
    setOcrStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex pl-10">
        <div className="w-full glass-panel bg-white/95 dark:bg-slate-900/95 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  OCR Extraction Engine
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Tax Year {activeTaxYear}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                Scan Receipt & Match Schedule C
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 flex-1">
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!scanResult ? (
              <div className="space-y-4">
                {isScanning ? (
                  <div className="border-2 border-dashed border-emerald-500/50 dark:border-emerald-500/30 rounded-2xl p-8 text-center bg-emerald-50/40 dark:bg-emerald-950/20">
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 animate-spin">
                      <RefreshCw className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Scanning Receipt with OCR Engine...</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{ocrStatus || 'Detecting vendor, date, and totals...'}</p>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt" onChange={handleFileUpload} className="hidden" />
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Upload Receipt Image or Invoice</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG, PDF or text receipt up to 10MB</p>
                  </div>
                )}

                <div className="relative flex py-2 items-center">
                  <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="shrink mx-4 text-xs font-semibold text-slate-400 uppercase">Or Paste Receipt Text</span>
                  <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                <textarea
                  rows={4}
                  value={rawTextPaste}
                  onChange={(e) => setRawTextPaste(e.target.value)}
                  placeholder="Paste receipt or invoice text (e.g. STAPLES #0412 2026-04-12 TOTAL: $48.74)..."
                  className="w-full glass-input p-3 rounded-xl text-xs font-mono"
                />

                <button
                  type="button"
                  onClick={() => handleProcessScan(rawTextPaste, 'pasted_receipt.txt')}
                  disabled={!rawTextPaste.trim() || isScanning}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isScanning ? 'Extracting Receipt Fields...' : 'Extract Receipt Data'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirm} className="space-y-4">
                {/* Receipt Preview Thumbnail */}
                {previewUrl && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="w-14 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{fileName || 'Receipt Attached'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Attached to expense for IRS audit trail</p>
                      {(scanResult.subtotal?.value || scanResult.taxAmount?.value) && (
                        <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                          {scanResult.subtotal?.value ? `Subtotal: $${scanResult.subtotal.value.toFixed(2)} ` : ''}
                          {scanResult.taxAmount?.value ? `• Tax: $${scanResult.taxAmount.value.toFixed(2)}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Detected Banner */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span><strong>Detected, Unconfirmed:</strong> Verify all extracted fields below before adding to the ledger.</span>
                  </div>
                  <button type="button" onClick={handleReset} className="text-xs text-amber-700 dark:text-amber-300 underline font-medium cursor-pointer shrink-0 ml-2">
                    Rescan
                  </button>
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Expense Date <span className="text-amber-600 dark:text-amber-400 text-[10px] font-normal">• Detected</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full glass-input p-2.5 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Total Amount ($) <span className="text-amber-600 dark:text-amber-400 text-[10px] font-normal">• Detected</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full glass-input p-2.5 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Payee / Vendor <span className="text-amber-600 dark:text-amber-400 text-[10px] font-normal">• Detected</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    className="w-full glass-input p-2.5 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Schedule C Mapping <span className="text-amber-600 dark:text-amber-400 text-[10px] font-normal">• Suggested</span>
                  </label>
                  <select
                    value={scheduleCLine}
                    onChange={(e) => {
                      const sel = e.target.value;
                      setScheduleCLine(sel);
                      const m = SCHEDULE_C_OPTIONS.find(o => o.line === sel);
                      if (m) setCategory(m.category as GeneralExpenseCategory);
                    }}
                    className="w-full glass-input p-2.5 rounded-lg text-sm text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {SCHEDULE_C_OPTIONS.map(o => (
                      <option key={o.line} value={o.line}>{o.line}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Description / Notes</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full glass-input p-2.5 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Payment Method</label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value as 'LLC_ACCOUNT' | 'OWNER_PERSONAL')}
                      className="w-full glass-input p-2.5 rounded-lg text-sm text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="LLC_ACCOUNT">Company Account</option>
                      <option value="OWNER_PERSONAL">Owner Personal (Reimbursable)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="ocrDeductible"
                      checked={isDeductible}
                      onChange={(e) => setIsDeductible(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="ocrDeductible" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      Tax Deductible Business Expense
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isFutureActiveYear || isSelectedDateFuture}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm ${
                      isFutureActiveYear || isSelectedDateFuture
                        ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Add to Ledger
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
