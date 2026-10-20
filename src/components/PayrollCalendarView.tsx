import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Sliders,
  Send,
} from 'lucide-react';
import {
  PayrollCalendarPeriod,
  PayScheduleConfig,
  TaxYear,
  Company,
  PayrollFrequency,
  WeekendRollRule,
} from '../types';
import { generateFiscalYearCalendar } from 'taxshield-ledger-core';

interface PayrollCalendarViewProps {
  company?: Company;
  activeTaxYear: number;
  taxYears?: TaxYear[];
  calendarPeriods?: PayrollCalendarPeriod[];
  payScheduleConfigs?: PayScheduleConfig[];
  onPublishCalendar?: (year: number, periods: PayrollCalendarPeriod[], config: PayScheduleConfig) => void;
  onUpdateScheduleConfig?: (config: PayScheduleConfig) => void;
  isOwner?: boolean;
}

export const PayrollCalendarView: React.FC<PayrollCalendarViewProps> = ({
  company,
  activeTaxYear = 2026,
  taxYears = [],
  calendarPeriods = [],
  payScheduleConfigs = [],
  onPublishCalendar,
  onUpdateScheduleConfig,
  isOwner = true,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(activeTaxYear);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);

  // Derive unique list of available tax years dynamically from database state + activeTaxYear
  const availableYears = Array.from(
    new Set([
      activeTaxYear,
      ...(taxYears || []).map((t) => t.year),
    ])
  ).sort((a, b) => b - a);

  // Current year schedule config or default
  const activeConfig: PayScheduleConfig = payScheduleConfigs.find(
    (c) => c.taxYearId === `ty_${selectedYear}` || c.companyId === company?.id
  ) || {
    companyId: company?.id || 'comp_main',
    taxYearId: `ty_${selectedYear}`,
    payFrequency: (company?.payFrequency as PayrollFrequency) || 'BI_WEEKLY',
    paydayDayOfWeek: 5,
    anchorPayDate: `${selectedYear}-01-16`,
    periodLagDays: 5,
    semiMonthlyDay1: 15,
    semiMonthlyDay2: 0,
    monthlyPayDay: 0,
    timesheetCutoffDays: 2,
    weekendRollRule: 'PREVIOUS_BUSINESS_DAY',
  };

  const [frequency, setFrequency] = useState<PayrollFrequency>(activeConfig.payFrequency);
  const [anchorPayDate, setAnchorPayDate] = useState<string>(activeConfig.anchorPayDate || `${selectedYear}-01-16`);
  const [paydayDayOfWeek, setPaydayDayOfWeek] = useState<number>(activeConfig.paydayDayOfWeek ?? 5);
  const [periodLagDays, setPeriodLagDays] = useState<number>(activeConfig.periodLagDays ?? 5);
  const [semiMonthlyDay1, setSemiMonthlyDay1] = useState<number>(activeConfig.semiMonthlyDay1 ?? 15);
  const [semiMonthlyDay2, setSemiMonthlyDay2] = useState<number>(activeConfig.semiMonthlyDay2 ?? 0);
  const [monthlyPayDay, setMonthlyPayDay] = useState<number>(activeConfig.monthlyPayDay ?? 0);
  const [cutoffDays, setCutoffDays] = useState<number>(activeConfig.timesheetCutoffDays);
  const [weekendRule, setWeekendRule] = useState<WeekendRollRule>(activeConfig.weekendRollRule);

  // Compute or filter calendar periods for selected year
  const activeYearPeriods = calendarPeriods.filter((p) => p.taxYearId === `ty_${selectedYear}` || p.periodStart.startsWith(String(selectedYear)));
  const displayPeriods = activeYearPeriods.length > 0
    ? activeYearPeriods
    : generateFiscalYearCalendar(company?.id || 'comp_main', `ty_${selectedYear}`, selectedYear, activeConfig);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentPeriod = displayPeriods.find(
    (p) => todayStr >= p.periodStart && todayStr <= p.periodEnd
  ) || displayPeriods[0];

  const handleGenerateAndPublish = () => {
    const newConfig: PayScheduleConfig = {
      ...activeConfig,
      payFrequency: frequency,
      anchorPayDate: anchorPayDate,
      paydayDayOfWeek: paydayDayOfWeek,
      periodLagDays: periodLagDays,
      semiMonthlyDay1: semiMonthlyDay1,
      semiMonthlyDay2: semiMonthlyDay2,
      monthlyPayDay: monthlyPayDay,
      timesheetCutoffDays: cutoffDays,
      weekendRollRule: weekendRule,
    };
    const newPeriods = generateFiscalYearCalendar(company?.id || 'comp_main', `ty_${selectedYear}`, selectedYear, newConfig);
    if (onPublishCalendar) {
      onPublishCalendar(selectedYear, newPeriods, newConfig);
    }
    if (onUpdateScheduleConfig) {
      onUpdateScheduleConfig(newConfig);
    }
    setIsConfigDrawerOpen(false);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-600 text-slate-900 dark:text-white shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
              Payroll Schedule & Lock Engine
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Fiscal Year Payroll Calendar
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fixed pay days, timesheet submission deadlines, & weekend roll adjustments for Tax Year {selectedYear}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                {activeConfig.payFrequency.replace('_', '-')} SCHEDULE
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                {displayPeriods.length} Pay Periods
              </span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                {activeConfig.timesheetCutoffDays}-Day Cutoff
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Tax Year {yr}
              </option>
            ))}
          </select>

          {isOwner && (
            <>
              <button
                onClick={() => setIsConfigDrawerOpen(true)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs border border-slate-200 dark:border-slate-700"
              >
                <Sliders className="w-4 h-4 text-slate-500" />
                Schedule Settings
              </button>
              <button
                onClick={handleGenerateAndPublish}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <Send className="w-4 h-4" />
                Publish Calendar ({selectedYear})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Current Period Highlight Card */}
      {currentPeriod && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/80">
                Active Pay Period #{currentPeriod.periodNumber}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1.5">
                {currentPeriod.periodStart} &mdash; {currentPeriod.periodEnd}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Employees must submit all timesheets before the lock cutoff timestamp.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                  Timesheet Cutoff
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200 font-mono flex items-center gap-1 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  {currentPeriod.timesheetLockDate}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                  Target Pay Day
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-200 font-mono flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {currentPeriod.actualPayDate}
                </span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                  Status
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded inline-block mt-0.5 border border-emerald-200 dark:border-emerald-800/80 font-mono">
                  {currentPeriod.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Periods Table */}
      <div className="glass-panel rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Full Fiscal Year Payroll & Timesheet Schedule ({selectedYear})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {displayPeriods.length} Total Periods
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Period #</th>
                <th className="py-3 px-4">Period Date Range</th>
                <th className="py-3 px-4">Timesheet Lock Deadline</th>
                <th className="py-3 px-4">Scheduled Pay Date</th>
                <th className="py-3 px-4">Actual Pay Date (Adjusted)</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
              {displayPeriods.map((period) => {
                const isCurrent = currentPeriod?.id === period.id;
                const isPastLock = new Date().toISOString().replace('T', ' ').split('.')[0] > period.timesheetLockDate;

                return (
                  <tr
                    key={period.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                      isCurrent ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{period.periodNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {period.periodStart} &rarr; {period.periodEnd}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        {isPastLock && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                        {period.timesheetLockDate}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {period.scheduledPayDate}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                      {period.actualPayDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {isPastLock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <Lock className="w-3 h-3 text-slate-500" />
                          LOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          OPEN
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Schedule Settings Slide-Over Drawer */}
      {isConfigDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsConfigDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xl w-full flex">
            <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Sliders className="w-5 h-5 text-indigo-500" />
                  Pay Schedule & Anchor Settings
                </h2>
                <button
                  onClick={() => setIsConfigDrawerOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Pay Frequency */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pay Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as PayrollFrequency)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BI_WEEKLY">Bi-Weekly (26 Pay Periods / Every 2 Weeks)</option>
                  <option value="WEEKLY">Weekly (52 Pay Periods / Every Week)</option>
                  <option value="SEMI_MONTHLY">Semi-Monthly (24 Pay Periods / 15th & EOM)</option>
                  <option value="MONTHLY">Monthly (12 Pay Periods / Monthly)</option>
                </select>
              </div>

              {/* Weekly & Bi-Weekly Anchor Settings */}
              {(frequency === 'BI_WEEKLY' || frequency === 'WEEKLY') && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 block">
                    {frequency.replace('_', '-')} Anchor Settings
                  </span>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Anchor Reference Pay Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={anchorPayDate}
                      onChange={(e) => setAnchorPayDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Reference payday to anchor even/odd week parity across tax years.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Payday Day of Week
                      </label>
                      <select
                        value={paydayDayOfWeek}
                        onChange={(e) => setPaydayDayOfWeek(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday (Default)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Period Lag Days
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={14}
                        value={periodLagDays}
                        onChange={(e) => setPeriodLagDays(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Semi-Monthly Anchor Settings */}
              {frequency === 'SEMI_MONTHLY' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 block">
                    Semi-Monthly Anchor Days
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        First Pay Day of Month
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={28}
                        value={semiMonthlyDay1}
                        onChange={(e) => setSemiMonthlyDay1(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Second Pay Day (0 = EOM)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        value={semiMonthlyDay2}
                        onChange={(e) => setSemiMonthlyDay2(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Period Lag Days
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={14}
                      value={periodLagDays}
                      onChange={(e) => setPeriodLagDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Monthly Anchor Settings */}
              {frequency === 'MONTHLY' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 block">
                    Monthly Anchor Settings
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Monthly Pay Day (0 = EOM)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        value={monthlyPayDay}
                        onChange={(e) => setMonthlyPayDay(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Period Lag Days
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={14}
                        value={periodLagDays}
                        onChange={(e) => setPeriodLagDays(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Timesheet Lock Cutoff Days */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Timesheet Submission Cutoff (Days After Period End)
                </label>
                <input
                  type="number"
                  min={0}
                  max={14}
                  value={cutoffDays}
                  onChange={(e) => setCutoffDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Employees must log and submit timesheets within {cutoffDays} day(s) after period end before entry editing locks.
                </p>
              </div>

              {/* Weekend & Holiday Roll Rule */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Weekend & Federal Holiday Adjustment Rule
                </label>
                <select
                  value={weekendRule}
                  onChange={(e) => setWeekendRule(e.target.value as WeekendRollRule)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PREVIOUS_BUSINESS_DAY">Roll to Preceding Business Day (Default)</option>
                  <option value="NEXT_BUSINESS_DAY">Roll to Next Business Day</option>
                  <option value="EXACT_DAY">Keep Exact Calendar Date</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfigDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAndPublish}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Save & Regenerate Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
