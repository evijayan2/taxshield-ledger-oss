import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  X,
  UserCheck,
  Check,
  Ban
} from 'lucide-react';
import { User, Employee } from '../types';

interface EmployeePtoViewProps {
  user: User | null;
  employee: Employee | null;
  activeTaxYear: number;
  isOwner?: boolean;
  isReadOnly?: boolean;
}

interface PtoRequest {
  id: string;
  employeeName: string;
  type: 'VACATION' | 'SICK' | 'PERSONAL' | 'BEREAVEMENT';
  startDate: string;
  endDate: string;
  totalHours: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function EmployeePtoView({
  user,
  employee,
  activeTaxYear,
  isOwner = false,
  isReadOnly = false,
}: EmployeePtoViewProps) {
  const [showDrawer, setShowDrawer] = useState(false);

  // Form State
  const [ptoType, setPtoType] = useState<'VACATION' | 'SICK' | 'PERSONAL' | 'BEREAVEMENT'>('VACATION');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyHours, setDailyHours] = useState('8');
  const [reason, setReason] = useState('');

  const currentEmpName = employee ? `${employee.firstName} ${employee.lastName}` : user?.email?.split('@')[0] || 'Employee';

  // Start fresh with 0 initial PTO requests (populated strictly via user/employee input)
  const [requests, setRequests] = useState<PtoRequest[]>([]);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedHoursYtd = requests
    .filter(r => r.status === 'APPROVED')
    .reduce((sum, r) => sum + r.totalHours, 0);

  const handleUpdateStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleCalculateHours = (): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays * (parseFloat(dailyHours) || 8);
  };

  const handleSubmitPto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    const calcHours = handleCalculateHours();

    const newRequest: PtoRequest = {
      id: `pto_${Date.now()}`,
      employeeName: currentEmpName,
      type: ptoType,
      startDate,
      endDate,
      totalHours: calcHours,
      reason,
      status: 'PENDING',
    };

    setRequests([newRequest, ...requests]);
    setReason('');
    setShowDrawer(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Paid Leave & Accrual Engine
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isOwner ? 'PTO & Leave Approvals Hub' : 'Time-Off & PTO Requests'}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {isOwner
              ? 'Review and approve employee vacation/sick leave requests to sync automatically with timesheets & payroll.'
              : 'Request vacation or sick leave and monitor your accrued paid time off balance.'}
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Request Paid Time Off
          </button>
        )}
      </div>

      {/* Accrual / Approval KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isOwner ? 'Pending Owner Approvals' : 'Vacation Leave Available'}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {isOwner ? `${pendingCount} Requests` : '40.0 hrs'}
          </p>
        </div>
        <div className="glass-card p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {isOwner ? 'Approved Paid Leave YTD' : 'Sick Leave Available'}
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {isOwner ? `${approvedHoursYtd.toFixed(1)} hrs` : '24.0 hrs'}
          </p>
        </div>
        <div className="glass-card p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Requests Logged</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{requests.length}</p>
        </div>
      </div>

      {/* PTO Table */}
      <div className="glass-panel p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-500" />
          {isOwner ? 'All Company Time-Off Requests' : 'My Time-Off Request History'} ({activeTaxYear})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                {isOwner && <th className="pb-3">Employee</th>}
                <th className="pb-3">Type</th>
                <th className="pb-3">Dates</th>
                <th className="pb-3">Total Hours</th>
                <th className="pb-3">Reason / Notes</th>
                <th className="pb-3 text-center">Status</th>
                {isOwner && <th className="pb-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  {isOwner && (
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      {req.employeeName}
                    </td>
                  )}
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                      req.type === 'VACATION'
                        ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                        : req.type === 'SICK'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                        : req.type === 'PERSONAL'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                        : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                    {req.startDate} → {req.endDate}
                  </td>
                  <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">{req.totalHours.toFixed(1)} hrs</td>
                  <td className="py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{req.reason}</td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : req.status === 'PENDING'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                    }`}>
                      {req.status === 'APPROVED' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : req.status === 'PENDING' ? (
                        <Clock className="w-3 h-3 text-amber-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-rose-500" />
                      )}
                      {req.status}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="py-3 text-right">
                      {req.status === 'PENDING' && !isReadOnly ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                            title="Approve PTO Request"
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-lg cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                            title="Reject PTO Request"
                            className="p-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-400 rounded-lg cursor-pointer transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Processed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer for Submitting PTO Request */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-sky-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Request Time Off</h3>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPto} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
                <select
                  value={ptoType}
                  onChange={(e) => setPtoType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="VACATION">Vacation Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="PERSONAL">Personal Time Off</option>
                  <option value="BEREAVEMENT">Bereavement / Family Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hours Per Day</label>
                <input
                  type="number"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  required
                />
                <p className="text-[10px] font-mono text-sky-600 dark:text-sky-400 mt-1">
                  Estimated total hours requested: {handleCalculateHours().toFixed(1)} hrs
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Provide a brief explanation for the leave request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/30 cursor-pointer"
                >
                  Submit PTO Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
