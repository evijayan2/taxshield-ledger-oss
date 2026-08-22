import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Receipt, 
  Filter, 
  Trash2, 
  Info, 
  Calendar, 
  MapPin, 
  FileCheck2, 
  DollarSign 
} from 'lucide-react';
import { MileageLog, TravelExpense, Employee, Organization } from '../types';
import { validateIrs5PointMileage } from '../utils/taxEngine';

interface MileageAndTravelViewProps {
  mileageLogs: MileageLog[];
  travelExpenses: TravelExpense[];
  employees: Employee[];
  org: Organization;
  onAddMileage: (log: Omit<MileageLog, 'id' | 'createdAt' | 'mileageAllowance' | 'calculatedMiles'>) => void;
  onDeleteMileage: (id: string) => void;
  onAddTravelExpense: (expense: Omit<TravelExpense, 'id' | 'createdAt'>) => void;
  onDeleteTravelExpense: (id: string) => void;
}

export function MileageAndTravelView({
  mileageLogs,
  travelExpenses,
  employees,
  org,
  onAddMileage,
  onDeleteMileage,
  onAddTravelExpense,
  onDeleteTravelExpense
}: MileageAndTravelViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'MILEAGE' | 'EXPENSES'>('MILEAGE');
  const [showTripModal, setShowTripModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<string>('ALL');

  // New Trip State
  const [tripForm, setTripForm] = useState({
    employeeId: employees[0]?.id || '',
    tripDate: new Date().toISOString().split('T')[0],
    originLocation: '',
    destinationLocation: '',
    businessPurpose: '',
    startOdometer: '',
    endOdometer: '',
    rateApplied: org.standardMileageRate || 0.67,
    isReimbursableAccountablePlan: true,
    status: 'APPROVED' as MileageLog['status'],
    notes: '',
  });

  // New Expense State
  const [expenseForm, setExpenseForm] = useState({
    employeeId: employees[0]?.id || '',
    mileageLogId: '',
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'TOLL_ROAD' as TravelExpense['category'],
    description: '',
    amount: '',
    paymentSource: 'PERSONAL_OUT_OF_POCKET' as TravelExpense['paymentSource'],
    receiptNote: '',
    isReimbursable: true,
    status: 'APPROVED' as TravelExpense['status'],
  });

  const parsedStart = parseFloat(tripForm.startOdometer) || 0;
  const parsedEnd = parseFloat(tripForm.endOdometer) || 0;
  const calculatedMiles = Math.max(0, parsedEnd - parsedStart);
  const calculatedAllowance = Math.round(calculatedMiles * tripForm.rateApplied * 100) / 100;

  const tripValidation = validateIrs5PointMileage({
    tripDate: tripForm.tripDate,
    originLocation: tripForm.originLocation,
    destinationLocation: tripForm.destinationLocation,
    businessPurpose: tripForm.businessPurpose,
    startOdometer: parsedStart,
    endOdometer: parsedEnd,
  });

  const filteredMileage = mileageLogs.filter(m => filterEmployee === 'ALL' || m.employeeId === filterEmployee);
  const filteredExpenses = travelExpenses.filter(e => filterEmployee === 'ALL' || e.employeeId === filterEmployee);

  const totalMiles = filteredMileage.reduce((sum, m) => sum + m.calculatedMiles, 0);
  const totalMileageDollars = filteredMileage.reduce((sum, m) => sum + m.mileageAllowance, 0);
  const totalTollsAndParking = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const combinedTravelTotal = totalMileageDollars + totalTollsAndParking;

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripValidation.isValid) return;

    onAddMileage({
      employeeId: tripForm.employeeId,
      tripDate: tripForm.tripDate,
      originLocation: tripForm.originLocation,
      destinationLocation: tripForm.destinationLocation,
      businessPurpose: tripForm.businessPurpose,
      startOdometer: parsedStart,
      endOdometer: parsedEnd,
      rateApplied: tripForm.rateApplied,
      isReimbursableAccountablePlan: tripForm.isReimbursableAccountablePlan,
      status: tripForm.status,
      notes: tripForm.notes,
    });

    setShowTripModal(false);
    setTripForm({
      ...tripForm,
      originLocation: '',
      destinationLocation: '',
      businessPurpose: '',
      startOdometer: '',
      endOdometer: '',
      notes: '',
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseForm.amount);
    if (!amt || amt <= 0 || !expenseForm.description) return;

    onAddTravelExpense({
      employeeId: expenseForm.employeeId,
      mileageLogId: expenseForm.mileageLogId || undefined,
      expenseDate: expenseForm.expenseDate,
      category: expenseForm.category,
      description: expenseForm.description,
      amount: amt,
      paymentSource: expenseForm.paymentSource,
      receiptNote: expenseForm.receiptNote,
      isReimbursable: expenseForm.isReimbursable,
      status: expenseForm.status,
    });

    setShowExpenseModal(false);
    setExpenseForm({
      ...expenseForm,
      description: '',
      amount: '',
      receiptNote: '',
    });
  };

  const exportMileageCSV = () => {
    const headers = ['Date', 'Driver', 'Origin', 'Destination', 'Business Purpose', 'Start Odometer', 'End Odometer', 'Total Miles', 'Rate', 'Total Allowance ($)', 'Accountable Plan / Tax Status'];
    const rows = filteredMileage.map(m => {
      const emp = employees.find(e => e.id === m.employeeId);
      return [
        m.tripDate,
        emp ? `${emp.firstName} ${emp.lastName}` : 'Owner',
        `"${m.originLocation.replace(/"/g, '""')}"`,
        `"${m.destinationLocation.replace(/"/g, '""')}"`,
        `"${m.businessPurpose.replace(/"/g, '""')}"`,
        m.startOdometer,
        m.endOdometer,
        m.calculatedMiles,
        m.rateApplied,
        m.mileageAllowance.toFixed(2),
        m.status
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IRS_5Point_Mileage_Log_${org.name.replace(/\s+/g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Business Miles</span>
            <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{totalMiles.toFixed(1)} <span className="text-xs font-normal text-slate-500">mi</span></p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">IRS Standard Rate @ ${org.standardMileageRate}/mi</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Mileage Deductions / Reimbursements</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">${totalMileageDollars.toFixed(2)}</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Accountable Plan Non-Taxable</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tolls & Parking Fees</span>
            <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">${totalTollsAndParking.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">PA Turnpike & Parking Meters</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Combined Travel Write-Off</span>
            <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">${combinedTravelTotal.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Offsets Owner Form 1040</p>
        </div>
      </div>

      {/* Action Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            id="subtab-mileage"
            onClick={() => setActiveSubTab('MILEAGE')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'MILEAGE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>IRS 5-Point Mileage Logs ({filteredMileage.length})</span>
          </button>

          <button
            id="subtab-expenses"
            onClick={() => setActiveSubTab('EXPENSES')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'EXPENSES'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Tolls & Parking Fees ({filteredExpenses.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Driver Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              id="filter-employee-select"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Drivers & Staff</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>

          {activeSubTab === 'MILEAGE' ? (
            <div className="flex items-center gap-2">
              <button
                id="export-csv-btn"
                onClick={exportMileageCSV}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Export IRS compliant spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                id="add-trip-btn"
                onClick={() => setShowTripModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log 5-Point Trip</span>
              </button>
            </div>
          ) : (
            <button
              id="add-expense-btn"
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Toll / Parking</span>
            </button>
          )}
        </div>
      </div>

      {/* 5-Point Audit Compliance Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-slate-900/40 border border-emerald-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900 dark:text-slate-100">IRS Audit-Proof 5-Point Rule Enforced</p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
            Every business trip requires: <strong className="text-slate-900 dark:text-slate-200">1) Date</strong>, <strong className="text-slate-900 dark:text-slate-200">2) Origin & Destination</strong>, <strong className="text-slate-900 dark:text-slate-200">3) Specific Business Purpose</strong>, <strong className="text-slate-900 dark:text-slate-200">4) Start Odometer</strong>, and <strong className="text-slate-900 dark:text-slate-200">5) End Odometer</strong>. Non-taxable reimbursements paid under an Accountable Plan are completely exempt from FIT, FICA, PA SIT (3.07%), and Local EIT.
          </p>
        </div>
      </div>

      {/* Data Tables */}
      {activeSubTab === 'MILEAGE' ? (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date & Driver</th>
                  <th className="py-3 px-4">Origin & Destination</th>
                  <th className="py-3 px-4">Business Purpose</th>
                  <th className="py-3 px-4 text-right">Odometer (Start / End)</th>
                  <th className="py-3 px-4 text-right">Miles</th>
                  <th className="py-3 px-4 text-right">Deduction ($)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredMileage.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      No 5-point mileage logs recorded yet. Click "Log 5-Point Trip" above to log a real business drive.
                    </td>
                  </tr>
                ) : (
                  filteredMileage.map((trip) => {
                    const emp = employees.find(e => e.id === trip.employeeId);
                    return (
                      <tr key={trip.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            <span>{trip.tripDate}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {emp ? `${emp.firstName} ${emp.lastName}` : 'Owner / Driver'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-start gap-1 text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span className="truncate">{trip.originLocation}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-4 truncate">
                            → {trip.destinationLocation}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed text-xs">
                            {trip.businessPurpose}
                          </p>
                          {trip.notes && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 italic block mt-0.5 truncate">{trip.notes}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">{trip.startOdometer.toFixed(1)}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">{trip.endOdometer.toFixed(1)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                          {trip.calculatedMiles.toFixed(1)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          ${trip.mileageAllowance.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            trip.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' :
                            trip.status === 'REIMBURSED' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' :
                            'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                          }`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onDeleteMileage(trip.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete trip log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date & Staff</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description & Receipt Ref</th>
                  <th className="py-3 px-4">Payment Source</th>
                  <th className="py-3 px-4 text-right">Amount ($)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                      No parking or highway toll expenses logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const emp = employees.find(e => e.id === exp.employeeId);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{exp.expenseDate}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{emp ? `${emp.firstName} ${emp.lastName}` : 'Owner'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                            {exp.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="text-slate-900 dark:text-slate-100 font-medium text-xs">{exp.description}</div>
                          {exp.receiptNote && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Receipt className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{exp.receiptNote}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-600 dark:text-slate-300">
                          {exp.paymentSource === 'PERSONAL_OUT_OF_POCKET' ? 'Personal (Reimbursable)' :
                           exp.paymentSource === 'EZPASS_BUSINESS' ? 'E-ZPass Business' : 'Company Card'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400 font-mono">
                          ${exp.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            {exp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => onDeleteTravelExpense(exp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Log 5-Point Trip */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Log IRS 5-Point Business Trip</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Strictly satisfies IRS contemporaneous audit rules</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTripModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTripSubmit} className="space-y-4 text-xs">
              {/* Point 1: Date & Driver */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">1. Trip Date *</label>
                  <input
                    type="date"
                    required
                    value={tripForm.tripDate}
                    onChange={(e) => setTripForm({ ...tripForm, tripDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Driver / Staff Member *</label>
                  <select
                    value={tripForm.employeeId}
                    onChange={(e) => setTripForm({ ...tripForm, employeeId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Point 2: Origin & Destination */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">2a. Origin Location / Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 1500 Market St, Philadelphia, PA (Office)"
                    value={tripForm.originLocation}
                    onChange={(e) => setTripForm({ ...tripForm, originLocation: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">2b. Destination Location / Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 500 North St, Harrisburg, PA (PA Revenue Office)"
                    value={tripForm.destinationLocation}
                    onChange={(e) => setTripForm({ ...tripForm, destinationLocation: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Point 3: Specific Business Purpose */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">3. Specific Business Purpose *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g., Vendor contract negotiation and physical inventory compliance inspection"
                  value={tripForm.businessPurpose}
                  onChange={(e) => setTripForm({ ...tripForm, businessPurpose: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Points 4 & 5: Odometer Readings */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">4. Start Odometer *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g., 42150.0"
                    value={tripForm.startOdometer}
                    onChange={(e) => setTripForm({ ...tripForm, startOdometer: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">5. End Odometer *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g., 42256.5"
                    value={tripForm.endOdometer}
                    onChange={(e) => setTripForm({ ...tripForm, endOdometer: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 text-xs">Calculated Miles: <strong className="text-slate-900 dark:text-white font-mono">{calculatedMiles.toFixed(1)} mi</strong></span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono">Deduction: ${calculatedAllowance.toFixed(2)}</span>
                </div>
              </div>

              {/* Live Audit Score Indicator */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tripValidation.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    IRS Audit Readiness: {tripValidation.score}%
                  </span>
                </div>
                {tripValidation.missingFields.length > 0 && (
                  <span className="text-[11px] text-rose-600 dark:text-rose-400">{tripValidation.missingFields[0]}</span>
                )}
              </div>

              {/* Accountable Plan Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold block text-xs">Accountable Plan Reimbursement</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Non-taxable addition to employee net pay</span>
                </div>
                <input
                  type="checkbox"
                  checked={tripForm.isReimbursableAccountablePlan}
                  onChange={(e) => setTripForm({ ...tripForm, isReimbursableAccountablePlan: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTripModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!tripValidation.isValid}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-md shadow-emerald-700/20"
                >
                  Save Compliant Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Toll / Parking Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Toll or Parking Expense</h3>
              </div>
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Staff Member *</label>
                <select
                  value={expenseForm.employeeId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, employeeId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as TravelExpense['category'] })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="TOLL_ROAD">Toll Road (Turnpike)</option>
                    <option value="PARKING_FEE">Parking (Garage/Meter)</option>
                    <option value="BRIDGE_TOLL">Bridge Toll</option>
                    <option value="PUBLIC_TRANSIT">Transit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="14.50"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., PA Turnpike Valley Forge to Harrisburg East"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Receipt / E-ZPass Statement Reference</label>
                <input
                  type="text"
                  placeholder="e.g., E-ZPass Statement #EZ-994102 or Meter Ticket #48"
                  value={expenseForm.receiptNote}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receiptNote: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-md shadow-emerald-700/20"
                >
                  Save Travel Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
