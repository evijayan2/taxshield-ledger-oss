import { X, Calendar, User, FileText, Layers, AlertTriangle } from 'lucide-react';
import { Employee, TimesheetEntry } from '../types';
import { generateBulkTimesheets, calculateTimesheetHours } from '../utils/timesheetUtils';
import { isFutureDateString } from '../utils/taxEngine';

export interface BulkTimesheetFormProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onBulkSubmit: (entries: Omit<TimesheetEntry, 'id' | 'createdAt'>[]) => void;
}

const DAY_OPTIONS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

/**
 * Modal form component for bulk logging staff or member timesheets over a date range.
 */
export function BulkTimesheetForm({
  employees = [],
  isOpen,
  onClose,
  onBulkSubmit,
}: BulkTimesheetFormProps) {
  const activeEmployees = employees.filter((e) => e && e.isActive);

  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0]
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('17:00');
  const [unpaidBreakMinutes, setUnpaidBreakMinutes] = useState(30);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && activeEmployees.length > 0) {
      if (!employeeId || !activeEmployees.some((e) => e.id === employeeId)) {
        setEmployeeId(activeEmployees[0].id);
      }
    }
  }, [isOpen, activeEmployees, employeeId]);

  if (!isOpen) return null;

  const isFutureRange = isFutureDateString(startDate) || isFutureDateString(endDate);

  const generatedEntries = generateBulkTimesheets({
    employeeId: employeeId || activeEmployees[0]?.id || '',
    startDate,
    endDate,
    daysOfWeek: selectedDays,
    startTime,
    endTime,
    unpaidBreakMinutes,
    notes,
  });

  const dailyHours = calculateTimesheetHours(startTime, endTime, unpaidBreakMinutes);
  const totalBulkHours = dailyHours.totalNetHours * generatedEntries.length;

  const toggleDay = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedEntries.length === 0 || isFutureRange) return;

    onBulkSubmit(generatedEntries);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex">
        <div className="w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
              Bulk Log Timesheet Range
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeEmployees.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No active LLC employees or staff members found.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Select LLC Staff Member / Member
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={employeeId || activeEmployees[0]?.id || ''}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} (
                      {emp.employmentType === 'W2_SALARY' ? 'Salary' : 'Hourly'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            {isFutureRange && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                ⚠️ Date ranges in future tax years are locked.
              </p>
            )}

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Active Days of Week
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {DAY_OPTIONS.map((day) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Break (m)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={unpaidBreakMinutes}
                  onChange={(e) => setUnpaidBreakMinutes(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Entries to Create: </span>
                <strong className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  {generatedEntries.length} day(s)
                </strong>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Cumulative Net: </span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  {totalBulkHours.toFixed(1)} hrs
                </strong>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Work Description / Project Notes Template
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Standard weekly LLC operations & client service"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generatedEntries.length === 0 || isFutureRange}
                className={`px-4 py-2 font-semibold rounded-lg shadow-lg transition ${
                  generatedEntries.length === 0 || isFutureRange
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
                }`}
              >
                Generate {generatedEntries.length} Timesheets
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  </div>
);
}
