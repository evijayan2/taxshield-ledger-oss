import React, { useState } from 'react';
import { Users, Mail, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Employee } from '../types';
import { useAuth } from '../context/AuthContext';

interface EmployeeSecurityRosterProps {
  employees: Employee[];
}

/**
 * Employee Security & Password Reset management component for LLC Owners.
 * Allows the owner to trigger single-use password reset links for any company staff member.
 */
export function EmployeeSecurityRoster({ employees = [] }: EmployeeSecurityRosterProps) {
  const { triggerEmployeePasswordReset } = useAuth();
  const [resettingEmail, setResettingEmail] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTriggerReset = async (email?: string) => {
    if (!email) return;
    setResettingEmail(email);
    setFeedback(null);
    try {
      const res = await triggerEmployeePasswordReset(email);
      setFeedback({
        type: 'success',
        message: res.message || `Password reset link dispatched to ${email}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || `Failed to trigger reset for ${email}.`,
      });
    } finally {
      setResettingEmail(null);
    }
  };

  const staffWithEmail = employees.filter((e) => Boolean(e.email));

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Staff Portal & Password Recovery</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Trigger instant password reset emails for employee portal users.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
          {staffWithEmail.length} User(s) with Email
        </span>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 transition animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="opacity-60 hover:opacity-100 font-bold px-1.5 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {staffWithEmail.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 italic py-2">
          No employees with email addresses registered. Add email addresses in the Staff & Onboarding module.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {staffWithEmail.map((emp) => {
            const isResetting = resettingEmail === emp.email;
            return (
              <div key={emp.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {emp.firstName} {emp.lastName}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        emp.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {emp.isActive ? 'Active' : 'Inactive (Read-Only)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{emp.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerReset(emp.email)}
                  disabled={isResetting}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'Sending...' : 'Trigger Password Reset'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

