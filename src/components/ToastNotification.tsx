import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

/**
 * In-app toast notification stack conforming to dual-theme contrast and mobile responsive design.
 * Replaces browser-native alert/confirm popups with accessible, styled banners.
 */
export function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((t) => {
      const ms = t.duration || 5000;
      return setTimeout(() => {
        onDismiss(t.id);
      }, ms);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        const borderBgClass = isSuccess
          ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
          : isWarning
          ? 'bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
          : isError
          ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
          : 'bg-slate-50 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100';

        const iconColorClass = isSuccess
          ? 'text-emerald-600 dark:text-emerald-400'
          : isWarning
          ? 'text-amber-600 dark:text-amber-400'
          : isError
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-indigo-600 dark:text-indigo-400';

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg backdrop-blur-md flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-5 duration-200 ${borderBgClass}`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className={`w-5 h-5 ${iconColorClass}`} />}
              {isWarning && <AlertTriangle className={`w-5 h-5 ${iconColorClass}`} />}
              {isError && <AlertCircle className={`w-5 h-5 ${iconColorClass}`} />}
              {!isSuccess && !isWarning && !isError && <Info className={`w-5 h-5 ${iconColorClass}`} />}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && <h5 className="text-xs font-bold leading-tight">{toast.title}</h5>}
              <p className={`text-xs ${toast.title ? 'mt-0.5' : ''} leading-relaxed font-normal`}>
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
}
