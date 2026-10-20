import React, { useState } from 'react';
import { Users, Plus, UserCheck, DollarSign, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Employee } from '../types';
import { StaffCard } from './StaffCard';
import { StaffFormModal } from './StaffFormModal';
import { useAuth } from '../context/AuthContext';

interface StaffManagementSectionProps {
  employees: Employee[];
  companyState?: string;
  org?: { state?: string };
  onSaveEmployees: (employees: Employee[]) => void;
}

/**
 * Staff management component with stats banner, modal-based creation,
 * automated portal invitation dispatch, and inactive read-only mode enforcement.
 */
export function StaffManagementSection({
  employees,
  companyState,
  org,
  onSaveEmployees,
}: StaffManagementSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { inviteEmployee } = useAuth();

  const activeCount = employees.filter((e) => e.isActive).length;
  const avgPayRate =
    employees.length > 0
      ? (employees.reduce((acc, curr) => acc + (curr.payRate || 0), 0) / employees.length).toFixed(2)
      : '0.00';

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSaveEmployee = async (updatedEmp: Employee, sendInvite?: boolean) => {
    const existingIndex = employees.findIndex((e) => e.id === updatedEmp.id);
    let newList: Employee[];
    const isNew = existingIndex < 0;

    if (!isNew) {
      newList = [...employees];
      newList[existingIndex] = updatedEmp;
    } else {
      newList = [...employees, updatedEmp];
    }
    onSaveEmployees(newList);
    handleCloseModal();

    if (sendInvite && updatedEmp.email) {
      try {
        await inviteEmployee(updatedEmp.email, `${updatedEmp.firstName} ${updatedEmp.lastName}`);
        showNotification('success', `Staff member added and portal invitation email sent to ${updatedEmp.email}.`);
      } catch (err: any) {
        showNotification('error', `Staff saved, but failed to send invite: ${err.message}`);
      }
    }
  };

  const handleInviteStaff = async (emp: Employee) => {
    if (!emp.email) return;
    setInvitingId(emp.id);
    try {
      await inviteEmployee(emp.email, `${emp.firstName} ${emp.lastName}`);
      showNotification('success', `Portal invitation email successfully sent to ${emp.email}.`);
    } catch (err: any) {
      showNotification('error', `Failed to send invitation to ${emp.email}: ${err.message}`);
    } finally {
      setInvitingId(null);
    }
  };

  const handleToggleActive = (id: string) => {
    const newList = employees.map((emp) =>
      emp.id === id ? { ...emp, isActive: !emp.isActive } : emp
    );
    onSaveEmployees(newList);
  };

  const handleDeleteEmployee = (id: string) => {
    if (employees.length <= 1) return;
    const newList = employees.filter((e) => e.id !== id);
    onSaveEmployees(newList);
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Staff Roster & Tax Classification
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Manage W-2 staff, 1099 contractors, Form W-4 withholdings, and PA local PSD tax codes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-700/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Staff</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Total Roster</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{employees.length} Staff</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Active Employees</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{activeCount} Active</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Avg Pay Rate</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">${avgPayRate}/hr</span>
          </div>
        </div>
      </div>

      {/* Notification Toast/Banner */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 transition animate-in fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
            <span className="font-medium text-xs">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs opacity-60 hover:opacity-100 font-bold px-1.5 py-0.5 cursor-pointer">✕</button>
        </div>
      )}

      {/* Roster Cards List */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {employees.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No staff members found.</p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-slate-900 dark:text-white hover:bg-emerald-700 transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Staff Member
            </button>
          </div>
        ) : (
          employees.map((emp) => (
            <StaffCard
              key={emp.id}
              employee={emp}
              isEditing={editingEmployee?.id === emp.id}
              onEdit={() => handleOpenEditModal(emp)}
              onToggleActive={() => handleToggleActive(emp.id)}
              onDelete={() => handleDeleteEmployee(emp.id)}
              onInvite={() => handleInviteStaff(emp)}
              inviting={invitingId === emp.id}
              canDelete={employees.length > 1}
            />
          ))
        )}
      </div>

      {/* Staff Form Modal */}
      <StaffFormModal
        isOpen={isModalOpen}
        employee={editingEmployee}
        companyState={companyState || org?.state || 'DE'}
        onSave={handleSaveEmployee}
        onClose={handleCloseModal}
      />
    </div>
  );
}
