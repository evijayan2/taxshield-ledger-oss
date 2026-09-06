import { useState, useEffect } from 'react';
import { loadAllAppData, saveAllAppData, AllAppData } from '../utils/storage';
import { getPostgresStatus, fetchServerAppData, saveServerAppData, PostgresStatus } from '../utils/api';
import { GeneralExpense, MileageLog, TravelExpense, TimesheetEntry, TimesheetStatus, Company, Organization, TaxYear, ComplianceTask } from '../types';
import { createAuditLogEntry } from '../utils/auditLogger';
import { createDefaultComplianceTasks, getTaskTaxYear, isFutureYear, isFutureDateString, getFutureYearLockMessage } from '../utils/taxEngine';

/**
 * Custom hook for managing application state, cloud sync, and audit logging.
 */
export function useAppState() {
  const [data, setData] = useState<AllAppData>(() => loadAllAppData());
  const [dbStatus, setDbStatus] = useState<PostgresStatus | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const checkAndSyncPostgres = async () => {
    try {
      const status = await getPostgresStatus();
      setDbStatus(status);
      if (status.connected) {
        setDbError(null);
        const serverData = await fetchServerAppData();
        if (serverData.source === 'postgres' && serverData.data) {
          const rawCompany = serverData.data.company || serverData.data.org || loadAllAppData().company;
          setData({
            ...serverData.data,
            company: rawCompany,
            org: rawCompany,
          });
        } else if (serverData.source === 'error') {
          setDbError(serverData.error || 'Failed to load ledger data from PostgreSQL server');
        }
      } else {
        setDbError(status.message || 'PostgreSQL database connection is unavailable');
      }
    } catch (err: any) {
      setDbError(err.message || 'Failed to connect to backend server');
      setDbStatus({
        configured: false,
        connected: false,
        message: `Network error: ${err.message}`
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Sync with cloud Postgres backend
  useEffect(() => {
    checkAndSyncPostgres();
  }, []);

  // Save to backend on change (debounced 800ms to batch rapid mutations)
  useEffect(() => {
    if (!isInitialLoading && dbStatus?.connected) {
      const timer = setTimeout(() => {
        saveServerAppData(data).catch((err) => {
          console.error('Error auto-saving state to PostgreSQL:', err);
          setDbError(`Failed to save state to PostgreSQL: ${err.message}`);
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [data, dbStatus?.connected, isInitialLoading]);

  // Handlers with Audit Trail logging
  const getActorEmail = () => data.company?.ownerEmail || data.org?.ownerEmail || 'owner';

  const handleSaveCompany = (newCompany: Company) => {
    const currentCompany = data.company || data.org;
    const isNew = !currentCompany?.name || currentCompany.name === '';
    const auditEntry = createAuditLogEntry(
      'Company',
      newCompany.id || 'comp_main',
      isNew ? 'CREATE' : 'UPDATE',
      newCompany.ownerEmail || getActorEmail(),
      currentCompany as unknown as Record<string, unknown>,
      newCompany as unknown as Record<string, unknown>,
      `${isNew ? 'Created' : 'Updated'} company entity profile: ${newCompany.name}`
    );

    setData(prev => ({
      ...prev,
      company: newCompany,
      org: newCompany,
      auditLogs: [auditEntry, ...(prev.auditLogs || [])],
    }));
  };

  const handleSaveOrg = handleSaveCompany;

  const handleCreateTaxYear = (year: number, status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED' = 'ACTIVE') => {
    const existingYears = data.taxYears || [];
    const exists = existingYears.find(ty => ty.year === year);
    let updatedYears: TaxYear[];
    let newYearRecord: TaxYear;

    if (exists) {
      newYearRecord = { ...exists, status };
      updatedYears = existingYears.map(ty => (ty.year === year ? newYearRecord : ty));
    } else {
      newYearRecord = {
        id: `ty_${year}`,
        companyId: data.company?.id || 'comp_main',
        year,
        status,
        createdAt: new Date().toISOString(),
      };
      updatedYears = [newYearRecord, ...existingYears];
    }

    // Ensure compliance tasks for target year exist
    const currentTasks = data.complianceTasks || [];
    const hasTasksForYear = currentTasks.some(t => getTaskTaxYear(t) === year);
    const updatedTasks = hasTasksForYear
      ? currentTasks
      : [...currentTasks, ...createDefaultComplianceTasks(year)];

    const auditEntry = createAuditLogEntry(
      'TaxYear',
      newYearRecord.id,
      exists ? 'UPDATE' : 'CREATE',
      getActorEmail(),
      exists as unknown as Record<string, unknown>,
      newYearRecord as unknown as Record<string, unknown>,
      `${exists ? 'Updated' : 'Initialized'} Tax Year ${year} with US-FEDERAL and PA tax rules baseline`
    );

    setData(prev => ({
      ...prev,
      taxYears: updatedYears,
      activeTaxYear: year,
      complianceTasks: updatedTasks,
      auditLogs: [auditEntry, ...(prev.auditLogs || [])],
    }));
  };

  const handleAddGeneralExpense = (expense: Omit<GeneralExpense, 'id' | 'createdAt'>) => {
    if (isFutureDateString(expense.expenseDate) || isFutureYear(data.activeTaxYear)) {
      console.warn(getFutureYearLockMessage(data.activeTaxYear || 2026, 'Adding general expense'));
      return;
    }
    const newExp: GeneralExpense = {
      ...expense,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const auditEntry = createAuditLogEntry('GeneralExpense', newExp.id, 'CREATE', getActorEmail(), null, newExp as unknown as Record<string, unknown>, `Added expense: ${newExp.payee} - $${newExp.amount}`);

    setData(prev => ({
      ...prev,
      generalExpenses: [newExp, ...prev.generalExpenses],
      auditLogs: [auditEntry, ...(prev.auditLogs || [])],
    }));
  };

  const handleDeleteGeneralExpense = (id: string) => {
    const target = data.generalExpenses.find(e => e.id === id);
    const auditEntry = createAuditLogEntry('GeneralExpense', id, 'DELETE', getActorEmail(), target as unknown as Record<string, unknown>, null, `Deleted expense: ${target?.payee || id}`);

    setData(prev => ({
      ...prev,
      generalExpenses: prev.generalExpenses.filter(e => e.id !== id),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])],
    }));
  };

  const handleAddMileage = (newTrip: Omit<MileageLog, 'id' | 'createdAt' | 'mileageAllowance' | 'calculatedMiles'>) => {
    if (isFutureDateString(newTrip.tripDate) || isFutureYear(data.activeTaxYear)) {
      console.warn(getFutureYearLockMessage(data.activeTaxYear || 2026, 'Logging mileage trip'));
      return;
    }
    const calculatedMiles = Math.max(0, newTrip.endOdometer - newTrip.startOdometer);
    const mileageAllowance = Math.round(calculatedMiles * newTrip.rateApplied * 100) / 100;
    const log: MileageLog = {
      ...newTrip,
      id: `mile_${Date.now()}`,
      calculatedMiles,
      mileageAllowance,
      createdAt: new Date().toISOString(),
    };
    const auditEntry = createAuditLogEntry('MileageLog', log.id, 'CREATE', getActorEmail(), null, log as unknown as Record<string, unknown>, `Logged trip: ${log.businessPurpose}`);

    setData(prev => ({
      ...prev,
      mileageLogs: [log, ...prev.mileageLogs],
      auditLogs: [auditEntry, ...(prev.auditLogs || [])],
    }));
  };

  const handleDeleteMileage = (id: string) => {
    const target = data.mileageLogs.find(m => m.id === id);
    const auditEntry = createAuditLogEntry('MileageLog', id, 'DELETE', getActorEmail(), target as unknown as Record<string, unknown>, null, `Deleted trip: ${target?.businessPurpose || id}`);

    setData(prev => ({
      ...prev,
      mileageLogs: prev.mileageLogs.filter(m => m.id !== id),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])],
    }));
  };

  const handleAddTravelExpense = (newExp: Omit<TravelExpense, 'id' | 'createdAt'>) => {
    if (isFutureDateString(newExp.expenseDate) || isFutureYear(data.activeTaxYear)) {
      console.warn(getFutureYearLockMessage(data.activeTaxYear || 2026, 'Adding travel expense'));
      return;
    }
    const exp: TravelExpense = {
      ...newExp,
      id: `trv_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const auditEntry = createAuditLogEntry('TravelExpense', exp.id, 'CREATE', getActorEmail(), null, exp as unknown as Record<string, unknown>, `Added travel expense: ${exp.description}`);

    setData(prev => ({
      ...prev,
      travelExpenses: [exp, ...prev.travelExpenses],
      auditLogs: [auditEntry, ...(prev.auditLogs || [])],
    }));
  };

  const handleDeleteTravelExpense = (id: string) => {
    const target = data.travelExpenses.find(t => t.id === id);
    const auditEntry = createAuditLogEntry('TravelExpense', id, 'DELETE', getActorEmail(), target as unknown as Record<string, unknown>, null, `Deleted travel expense: ${target?.description || id}`);

    setData(prev => ({
      ...prev,
      travelExpenses: prev.travelExpenses.filter(t => t.id !== id),
      auditLogs: [auditEntry, ...(prev.auditLogs || [])],
    }));
  };

  const handleAddTimesheet = (newEntry: Omit<TimesheetEntry, 'id' | 'createdAt'>) => {
    if (isFutureDateString(newEntry.workDate) || isFutureYear(data.activeTaxYear)) {
      console.warn(getFutureYearLockMessage(data.activeTaxYear || 2026, 'Adding timesheet entry'));
      return;
    }
    const entry: TimesheetEntry = {
      ...newEntry,
      id: `ts_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      timesheets: [entry, ...(prev.timesheets || [])],
    }));
  };

  const handleBulkAddTimesheets = (entries: Omit<TimesheetEntry, 'id' | 'createdAt'>[]) => {
    const validEntries = entries.filter(e => !isFutureDateString(e.workDate));
    if (validEntries.length === 0 || isFutureYear(data.activeTaxYear)) {
      console.warn(getFutureYearLockMessage(data.activeTaxYear || 2026, 'Bulk adding timesheets'));
      return;
    }
    const newEntries: TimesheetEntry[] = validEntries.map((e, idx) => ({
      ...e,
      id: `ts_${Date.now()}_${idx}`,
      createdAt: new Date().toISOString(),
    }));
    setData(prev => ({
      ...prev,
      timesheets: [...newEntries, ...(prev.timesheets || [])],
    }));
  };

  const handleUpdateTimesheetStatus = (id: string, status: TimesheetStatus) => {
    setData(prev => ({
      ...prev,
      timesheets: (prev.timesheets || []).map(t => (t.id === id ? { ...t, status } : t)),
    }));
  };

  const handleDeleteTimesheet = (id: string) => {
    setData(prev => ({
      ...prev,
      timesheets: (prev.timesheets || []).filter(t => t.id !== id),
    }));
  };

  const handleSetTaxYear = (year: number) => {
    setData(prev => {
      const currentTasks = prev.complianceTasks || [];
      const hasTasksForYear = currentTasks.some(t => getTaskTaxYear(t) === year);
      const updatedTasks = hasTasksForYear
        ? currentTasks
        : [...currentTasks, ...createDefaultComplianceTasks(year)];

      return {
        ...prev,
        activeTaxYear: year,
        complianceTasks: updatedTasks,
      };
    });
  };

  const handleMarkTaskFiled = (
    taskIdOrFormId: string,
    confirmationNum: string,
    taskDetails?: Partial<ComplianceTask>
  ) => {
    setData(prev => {
      const activeYear = prev.activeTaxYear || 2026;
      if (isFutureYear(activeYear) || (taskDetails?.taxYear && isFutureYear(taskDetails.taxYear))) {
        console.warn(getFutureYearLockMessage(activeYear, 'Filing tax return'));
        return prev;
      }
      const todayStr = new Date().toISOString().split('T')[0];
      const tasks = prev.complianceTasks || [];

      // Find matching task by id, or formIdentifier/jurisdiction in the active tax year
      const existingIdx = tasks.findIndex(
        t =>
          t.id === taskIdOrFormId ||
          ((getTaskTaxYear(t) === activeYear) &&
            ((taskDetails?.formIdentifier && t.formIdentifier === taskDetails.formIdentifier) ||
             (taskDetails?.jurisdiction && t.jurisdiction === taskDetails.jurisdiction)))
      );

      let updatedTasks: ComplianceTask[];
      let targetTask: ComplianceTask;
      let isNew = false;

      if (existingIdx >= 0) {
        const existing = tasks[existingIdx];
        if (isFutureYear(existing.taxYear || activeYear)) {
          console.warn(getFutureYearLockMessage(existing.taxYear || activeYear, 'Filing tax return'));
          return prev;
        }
        targetTask = {
          ...existing,
          taxYear: existing.taxYear || activeYear,
          status: 'FILED',
          confirmationNumber: confirmationNum,
          filedDate: todayStr,
          amountDue: taskDetails?.amountDue ?? existing.amountDue,
          boxValues: taskDetails?.boxValues || existing.boxValues,
        };
        updatedTasks = tasks.map((t, idx) => (idx === existingIdx ? targetTask : t));
      } else {
        isNew = true;
        targetTask = {
          id: taskDetails?.id || `comp_${Date.now()}`,
          taxYear: activeYear,
          jurisdiction: taskDetails?.jurisdiction || 'PA_MYPATH_SIT',
          formIdentifier: taskDetails?.formIdentifier || 'REV_1667',
          title: taskDetails?.title || 'Tax Remittance Return',
          taxPeriodLabel: taskDetails?.taxPeriodLabel || `${activeYear} Remittance`,
          dueDate: taskDetails?.dueDate || todayStr,
          status: 'FILED',
          amountDue: taskDetails?.amountDue ?? 0,
          confirmationNumber: confirmationNum,
          filedDate: todayStr,
          boxValues: taskDetails?.boxValues || {},
        };
        updatedTasks = [targetTask, ...tasks];
      }

      const auditEntry = createAuditLogEntry(
        'ComplianceTask',
        targetTask.id,
        isNew ? 'CREATE' : 'UPDATE',
        getActorEmail(),
        existingIdx >= 0 ? (tasks[existingIdx] as unknown as Record<string, unknown>) : null,
        targetTask as unknown as Record<string, unknown>,
        `Tax remittance filed & paid: ${targetTask.title} (${targetTask.formIdentifier}) - Amount: $${(targetTask.amountDue || 0).toFixed(2)} - Confirmation/ACH Ref: ${confirmationNum}`
      );

      return {
        ...prev,
        complianceTasks: updatedTasks,
        auditLogs: [auditEntry, ...(prev.auditLogs || [])],
      };
    });
  };

  return {
    data,
    setData,
    dbStatus,
    dbError,
    retryDatabaseConnection: checkAndSyncPostgres,
    isInitialLoading,
    handleAddGeneralExpense,
    handleDeleteGeneralExpense,
    handleAddMileage,
    handleDeleteMileage,
    handleAddTravelExpense,
    handleDeleteTravelExpense,
    handleAddTimesheet,
    handleBulkAddTimesheets,
    handleUpdateTimesheetStatus,
    handleDeleteTimesheet,
    handleSetTaxYear,
    handleCreateTaxYear,
    handleMarkTaskFiled,
    handleSaveCompany,
    handleSaveOrg,
  };
}
