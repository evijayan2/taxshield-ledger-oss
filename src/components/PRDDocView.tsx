import React, { useState } from 'react';
import { 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  BookOpen 
} from 'lucide-react';
import { PRD_DOCUMENT_DATA } from '../prdData';
import { requestGoogleAccessToken, createGoogleDocPRD } from '../googleDocsService';

export function PRDDocView() {
  const [creationStatus, setCreationStatus] = useState<'idle' | 'authorizing' | 'creating' | 'success' | 'error'>('idle');
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateGoogleDoc = async () => {
    setCreationStatus('authorizing');
    setErrorMessage(null);

    try {
      const token = await requestGoogleAccessToken();
      setCreationStatus('creating');
      const { docUrl } = await createGoogleDocPRD(token);
      setDocUrl(docUrl);
      setCreationStatus('success');
    } catch (err: any) {
      console.error("Google Doc creation error:", err);
      setCreationStatus('error');
      setErrorMessage(err?.message || "Failed to create document in Google Docs. Please try again.");
    }
  };

  const handleCopyMarkdown = () => {
    const markdown = `# ${PRD_DOCUMENT_DATA.title}\n\n## ${PRD_DOCUMENT_DATA.subtitle}\n\n` + 
      PRD_DOCUMENT_DATA.sections.map(s => {
        let sec = `### ${s.title}\n${s.summary ? `*${s.summary}*\n\n` : ''}`;
        if (s.paragraphs) sec += s.paragraphs.join('\n\n') + '\n\n';
        if (s.bulletGroups) {
          sec += s.bulletGroups.map(bg => `#### ${bg.heading}\n` + bg.items.map(i => `- ${i}`).join('\n')).join('\n\n') + '\n\n';
        }
        if (s.modules) {
          sec += s.modules.map(m => `#### ${m.name}\n` + m.features.map(f => `- ${f}`).join('\n')).join('\n\n') + '\n\n';
        }
        if (s.techPoints) sec += s.techPoints.map(t => `- ${t}`).join('\n') + '\n\n';
        if (s.metrics) sec += s.metrics.map(m => `- [ ] ${m}`).join('\n') + '\n\n';
        return sec;
      }).join('---\n\n');

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Google Docs Export CTA */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Product Requirements & Architecture Reference</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive system specification for Micro-LLC expense management, 5-point mileage, and zero-cost assisted payroll.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy PRD'}</span>
          </button>

          <button
            id="export-google-docs-btn-view"
            onClick={handleCreateGoogleDoc}
            disabled={creationStatus === 'authorizing' || creationStatus === 'creating'}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer disabled:opacity-50"
          >
            {creationStatus === 'authorizing' || creationStatus === 'creating' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating in Google Docs...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>Export to Google Docs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Callout Banner */}
      {creationStatus === 'success' && docUrl && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">Document Created in Google Docs!</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300/90 mt-0.5">The complete PRD is now available in your Google Drive.</p>
            </div>
          </div>
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
          >
            <span>Open Document</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {creationStatus === 'error' && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-900 dark:text-rose-100 text-sm">Google Docs Connection Notice</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={handleCreateGoogleDoc}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-800 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* PRD Sections View */}
      <div className="space-y-4">
        {PRD_DOCUMENT_DATA.sections.map((section) => (
          <div key={section.id} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{section.title}</h4>
              {section.summary && (
                <span className="text-xs text-slate-500 dark:text-slate-400 italic">{section.summary}</span>
              )}
            </div>

            {section.paragraphs && (
              <div className="space-y-2">
                {section.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            )}

            {section.bulletGroups && (
              <div className="space-y-3 pt-1">
                {section.bulletGroups.map((bg, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <h5 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{bg.heading}</h5>
                    <ul className="space-y-1 pl-4 list-disc text-xs text-slate-700 dark:text-slate-300">
                      {bg.items.map((item, iIdx) => (
                        <li key={iIdx} className="leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {section.modules && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {section.modules.map((mod, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">{mod.name}</span>
                    <ul className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      {mod.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {section.techPoints && (
              <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-700 dark:text-slate-300 pt-1">
                {section.techPoints.map((tp, idx) => (
                  <li key={idx} className="leading-relaxed">{tp}</li>
                ))}
              </ul>
            )}

            {section.metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {section.metrics.map((metric, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{metric}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
