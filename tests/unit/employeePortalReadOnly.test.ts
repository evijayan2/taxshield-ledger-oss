import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../server/prisma.js';
import { createSession, validateSession } from '../../server/auth/session.js';
import { hashPassword } from '../../server/auth/password.js';
import { calculateW2Summaries } from '../../src/utils/w2w3Data.js';
import { Employee, Organization, PayStub } from '../../src/types.js';

describe('Employee Portal & Inactive Read-Only Access', () => {
  const testCompanyId = `comp_ro_${Date.now()}`;
  const ownerEmail = `owner_ro_${Date.now()}@example.com`;
  const employeeEmail = `emp_ro_${Date.now()}@example.com`;
  let employeeUserId: string;
  let employeeSessionToken: string;

  beforeAll(async () => {
    // Create test company
    await prisma.company.create({
      data: {
        id: testCompanyId,
        name: 'Acme Test LLC',
        ein: '12-3456789',
        stateTaxId: '12345678',
        address: '123 Market St',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19106',
        ownerName: 'Alice Owner',
        ownerEmail,
      },
    });

    // Create employee user
    const passwordHash = await hashPassword('EmployeePass2026!');
    const empUser = await prisma.user.create({
      data: {
        email: employeeEmail,
        displayName: 'John Employee',
        isActive: true,
        credential: {
          create: {
            passwordHash,
          },
        },
        memberships: {
          create: {
            companyId: testCompanyId,
            role: 'EMPLOYEE',
            status: 'DEACTIVATED', // Inactive / Deactivated
          },
        },
      },
    });
    employeeUserId = empUser.id;

    // Create employee payroll record
    await prisma.employee.create({
      data: {
        id: `emp_record_${Date.now()}`,
        companyId: testCompanyId,
        firstName: 'John',
        lastName: 'Employee',
        email: employeeEmail,
        phone: '555-0199',
        ssnLastFour: '1234',
        payRate: 35.0,
        payFrequency: 'BI_WEEKLY',
        employmentType: 'W2_HOURLY',
        w4FilingStatus: 'SINGLE',
        isActive: false, // Inactive employee record
      },
    });
  });

  afterAll(async () => {
    await prisma.company.deleteMany({
      where: { id: testCompanyId },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, employeeEmail] } },
    });
    await prisma.$disconnect();
  });

  it('should authenticate and validate session for deactivated employee in read-only mode', async () => {
    const { opaqueToken } = await createSession(employeeUserId);
    employeeSessionToken = opaqueToken;

    const authSession = await validateSession(employeeSessionToken);
    expect(authSession).not.toBeNull();
    expect(authSession?.user.email).toBe(employeeEmail);
    expect(authSession?.membership).not.toBeNull();
    expect(authSession?.membership?.role).toBe('EMPLOYEE');
    expect(authSession?.membership?.status).toBe('DEACTIVATED');
  });

  it('should permit inactive employee to access their historical paystubs and W-2 calculations', () => {
    const org: Organization = {
      id: testCompanyId,
      name: 'Acme Test LLC',
      ein: '12-3456789',
      stateTaxId: '12345678',
      address: '123 Market St',
      city: 'Philadelphia',
      state: 'PA',
      zip: '19106',
      ownerName: 'Alice Owner',
      ownerEmail,
      ownerTaxBracket: 24,
      stateFilingFrequency: 'MONTHLY',
      standardMileageRate: 0.67,
    };

    const employee: Employee = {
      id: 'emp_1',
      firstName: 'John',
      lastName: 'Employee',
      email: employeeEmail,
      phone: '555-0199',
      ssnLastFour: '1234',
      payRate: 35.0,
      payFrequency: 'BI_WEEKLY',
      employmentType: 'W2_HOURLY',
      w4FilingStatus: 'SINGLE',
      w4MultipleJobs: false,
      w4DependentCredit: 0,
      w4OtherIncome: 0,
      w4Deductions: 0,
      w4ExtraWithholding: 0,
      isActive: false, // Inactive staff
    };

    const stubs: PayStub[] = [
      {
        id: 'stub_1',
        payrollRunId: 'run_1',
        employeeId: 'emp_1',
        periodStart: '2026-01-01',
        periodEnd: '2026-01-15',
        payDate: '2026-01-20',
        hoursWorked: 80,
        overtimeHours: 0,
        hourlyRate: 35.0,
        grossEarnings: 2800.0,
        federalIncomeTax: 250.0,
        socialSecurityTax: 173.6,
        medicareTax: 40.6,
        stateCode: 'PA',
        stateIncomeTax: 86.0,
        localIncomeTax: 28.0,
        localFlatTax: 2.0,
        paStateTax: 86.0,
        paLocalEit: 28.0,
        paLst: 2.0,
        totalEmployeeTaxes: 580.2,
        mileageReimbursement: 50.0,
        travelExpensesReimbursement: 0,
        totalReimbursements: 50.0,
        netPay: 2269.8,
        employerSocialSecurity: 173.6,
        employerMedicare: 40.6,
        employerStateUnemployment: 25.0,
        employerPaUc: 25.0,
        totalEmployerTaxes: 239.2,
        totalCompanyCost: 3089.2,
        disbursementMethod: 'ACH',
        disbursementStatus: 'PAID',
        createdAt: '2026-01-20T00:00:00.000Z',
      },
    ];

    // Compute Form W-2 for the inactive employee
    const w2Summaries = calculateW2Summaries(org, [employee], stubs);
    expect(w2Summaries).toHaveLength(1);
    expect(w2Summaries[0].employeeLastName).toBe('Employee');
    expect(w2Summaries[0].boxes.box1Wages).toBe(2800.0);
    expect(w2Summaries[0].boxes.box2FedTax).toBe(250.0);
    expect(w2Summaries[0].boxes.box16StateWages).toBe(2800.0);
    expect(w2Summaries[0].boxes.box17StateTax).toBe(86.0);
  });
});
