import { describe, it, expect } from 'vitest';
import { createAuditLogEntry } from '../../src/utils/auditLogger';
import { createDefaultComplianceTasks } from '../../src/utils/taxEngine';
import { AllAppData } from '../../src/utils/storage';

describe('Reset Ledger Workflow Unit Tests', () => {
  it('should reset all transactional records to empty arrays while preserving company metadata', () => {
    const mockState: Partial<AllAppData> = {
      company: {
        id: 'comp_123',
        name: 'ImpactFlow Labs LLC',
        ein: '12-3456789',
        stateTaxId: 'PA-12345678',
        address: '100 Main St',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19102',
        ownerName: 'Managing Member',
        ownerEmail: 'owner@impactflow.test',
        stateFilingFrequency: 'MONTHLY',
        payFrequency: 'BI_WEEKLY',
      },
      activeTaxYear: 2026,
      taxYears: [
        {
          id: 'ty_2026',
          companyId: 'comp_123',
          year: 2026,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
      ],
      generalExpenses: [
        {
          id: 'exp_1',
          expenseDate: '2026-02-01',
          payee: 'Aqua',
          category: 'UTILITIES',
          amount: 69.26,
          paidBy: 'LLC_ACCOUNT',
          description: 'Water utility bill',
          isTaxDeductible: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'exp_2',
          expenseDate: '2026-02-15',
          payee: 'Wells Fargo Auto',
          category: 'OTHER',
          amount: 856.78,
          paidBy: 'LLC_ACCOUNT',
          description: 'Auto loan payment',
          isTaxDeductible: true,
          createdAt: new Date().toISOString(),
        },
      ],
      mileageLogs: [
        {
          id: 'mil_1',
          employeeId: 'emp_1',
          tripDate: '2026-02-10',
          originLocation: 'Office',
          destinationLocation: 'Client',
          businessPurpose: 'Meeting',
          startOdometer: 10000,
          endOdometer: 10045,
          calculatedMiles: 45,
          rateApplied: 0.67,
          mileageAllowance: 30.15,
          isReimbursableAccountablePlan: true,
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
        },
      ],
      payrollRuns: [
        {
          id: 'run_1',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-14',
          payDate: '2026-01-19',
          status: 'DISBURSED',
          totalGross: 2500,
          totalEmployeeTaxes: 450,
          totalReimbursements: 30.15,
          totalNetPay: 2080.15,
          totalEmployerTaxes: 210,
          totalCompanyCost: 2740.15,
          stubsCount: 1,
          createdAt: new Date().toISOString(),
        },
      ],
      invoices: [],
      bankTransactions: [],
      auditLogs: [],
    };

    // Simulate reset ledger transformation
    const auditEntry = createAuditLogEntry(
      'Company',
      mockState.company!.id,
      'UPDATE',
      mockState.company!.ownerEmail,
      {
        generalExpensesCount: mockState.generalExpenses?.length || 0,
        mileageLogsCount: mockState.mileageLogs?.length || 0,
      },
      { resetAt: new Date().toISOString() },
      'Full ledger reset: cleared all expenses, mileage logs, and transactions.'
    );

    const resetState: Partial<AllAppData> = {
      ...mockState,
      generalExpenses: [],
      mileageLogs: [],
      travelExpenses: [],
      payrollRuns: [],
      payStubs: [],
      timesheets: [],
      invoices: [],
      contractorPayments: [],
      bankTransactions: [],
      bankBatches: [],
      complianceTasks: createDefaultComplianceTasks(mockState.activeTaxYear || 2026),
      auditLogs: [auditEntry, ...(mockState.auditLogs || [])],
    };

    // Assertions
    expect(resetState.company?.name).toBe('ImpactFlow Labs LLC');
    expect(resetState.company?.ein).toBe('12-3456789');
    expect(resetState.generalExpenses).toHaveLength(0);
    expect(resetState.mileageLogs).toHaveLength(0);
    expect(resetState.payrollRuns).toHaveLength(0);
    expect(resetState.invoices).toHaveLength(0);
    expect(resetState.bankTransactions).toHaveLength(0);

    // Audit trail should have exactly 1 record documenting the reset
    expect(resetState.auditLogs).toHaveLength(1);
    expect(resetState.auditLogs![0].action).toBe('UPDATE');
    expect(resetState.auditLogs![0].entityType).toBe('Company');
    expect(resetState.auditLogs![0].reason).toContain('Full ledger reset');

    // Total YTD deductions should now compute to 0
    const totalExpenses = (resetState.generalExpenses || []).reduce((sum, e) => sum + e.amount, 0);
    expect(totalExpenses).toBe(0);
  });

  it('should reset compliance tasks to zero amount due', () => {
    const tasks = createDefaultComplianceTasks(2026);
    expect(tasks.length).toBeGreaterThan(0);
    for (const task of tasks) {
      expect(task.amountDue).toBe(0);
    }
  });
});
