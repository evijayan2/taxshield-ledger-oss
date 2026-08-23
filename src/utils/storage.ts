import { 
  Organization, 
  Employee, 
  MileageLog, 
  TravelExpense, 
  PayrollRun, 
  PayStub, 
  ComplianceTask, 
  GeneralExpense 
} from '../types';

const STORAGE_KEYS = {
  ORG: 'taxshield_org',
  EMPLOYEES: 'taxshield_employees',
  MILEAGE: 'taxshield_mileage',
  TRAVEL_EXPENSES: 'taxshield_travel_expenses',
  PAYROLL_RUNS: 'taxshield_payroll_runs',
  PAY_STUBS: 'taxshield_pay_stubs',
  COMPLIANCE_TASKS: 'taxshield_compliance_tasks',
  GENERAL_EXPENSES: 'taxshield_general_expenses',
};

// Real Production Default Organization for tovijayan@gmail.com
export const REAL_DEFAULT_ORG: Organization = {
  id: 'org_real_01',
  name: 'Vijayan Enterprise LLC',
  ein: '88-4928104',
  stateTaxId: 'PA-84920194',
  address: '1500 Market St, Suite 1200',
  city: 'Philadelphia',
  state: 'PA',
  zip: '19102',
  ownerName: 'Vijay',
  ownerEmail: 'tovijayan@gmail.com',
  ownerTaxBracket: 24, // 24% Marginal Federal Bracket
  filingFrequencyPA: 'MONTHLY',
  standardMileageRate: 0.67, // 67 cents/mile (2024-2026 standard IRS rate)
};

// Initial Real Clean Default Employees (or start fresh)
export const REAL_DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp_01',
    firstName: 'Arun',
    lastName: 'Kumar',
    email: 'arun.k@example.com',
    phone: '(215) 555-0182',
    ssnLastFour: '4921',
    employmentType: 'W2_HOURLY',
    payRate: 25.00, // $25/hr
    payFrequency: 'BI_WEEKLY',
    w4FilingStatus: 'MARRIED_FILING_JOINTLY',
    w4MultipleJobs: false,
    w4DependentCredit: 2000,
    w4OtherIncome: 0,
    w4Deductions: 0,
    w4ExtraWithholding: 0,
    paPsdCode: '460401', // Montgomery County - Lower Merion
    paPsdName: 'Lower Merion Twp / Montgomery',
    paResidentEitRate: 0.0100, // 1.00%
    paWorkPsdCode: '510101', // Philadelphia
    paWorkEitRate: 0.0375, // Philadelphia Non-Resident / Work
    paLstAnnual: 52.00,
    paLstExempt: false,
    zelleHandle: 'arunkumar.pay@gmail.com',
    bankAccountMasked: '•••• 8821',
    isActive: true,
  }
];

export const INITIAL_COMPLIANCE_TASKS: ComplianceTask[] = [
  {
    id: 'comp_01',
    jurisdiction: 'PA_MYPATH_SIT',
    formIdentifier: 'REV_1667',
    title: 'PA myPATH Form REV-1667 (State Withholding Return)',
    taxPeriodLabel: '2026 Monthly / Quarterly',
    dueDate: '2026-09-15',
    status: 'READY_TO_FILE',
    amountDue: 0.00,
    boxValues: {
      'box1_gross': { label: 'Total PA Gross Compensation', value: '$0.00', helper: 'Total wages paid to PA residents and for PA work' },
      'box2_tax_withheld': { label: 'PA Income Tax Withheld (3.07%)', value: '$0.00', helper: 'Exact 3.07% PA statutory withholding' },
      'box3_remittance': { label: 'Total Remittance Amount', value: '$0.00', helper: 'Paid via myPATH electronic bank debit / credit' }
    }
  },
  {
    id: 'comp_02',
    jurisdiction: 'FEDERAL_IRS',
    formIdentifier: 'FORM_941',
    title: 'IRS Form 941 (Employer Quarterly Federal Tax Return)',
    taxPeriodLabel: '2026 Q3 (Jul - Sep)',
    dueDate: '2026-10-31',
    status: 'READY_TO_FILE',
    amountDue: 0.00,
    boxValues: {
      'box1_employees': { label: '1. Number of employees paid in period', value: '1' },
      'box2_wages': { label: '2. Wages, tips, and other compensation', value: '$0.00' },
      'box3_fed_tax': { label: '3. Federal income tax withheld from wages', value: '$0.00' },
      'box5a_ss_wages': { label: '5a. Taxable social security wages', value: '$0.00', helper: 'Both employee (6.2%) and employer (6.2%)' },
      'box5c_med_wages': { label: '5c. Taxable Medicare wages', value: '$0.00', helper: 'Both employee (1.45%) and employer (1.45%)' },
      'box10_total_taxes': { label: '10. Total taxes after adjustments', value: '$0.00' }
    }
  },
  {
    id: 'comp_03',
    jurisdiction: 'PA_MYPATH_UC',
    formIdentifier: 'PA_UC_2',
    title: 'PA Unemployment Compensation Return (Form UC-2 / UC-2A)',
    taxPeriodLabel: '2026 Q3 (Jul - Sep)',
    dueDate: '2026-10-31',
    status: 'PENDING',
    amountDue: 0.00,
    boxValues: {
      'total_wages': { label: 'Gross PA UC Covered Wages', value: '$0.00' },
      'employer_contribution': { label: 'Employer UC Contribution (3.822%)', value: '$0.00' },
      'employee_withholding': { label: 'Employee UC Withholding (0.07%)', value: '$0.00' }
    }
  },
  {
    id: 'comp_04',
    jurisdiction: 'SSA_W2',
    formIdentifier: 'W2_W3',
    title: 'Year-End Forms W-2 / W-3 Portal Package (SSA BSO & myPATH)',
    taxPeriodLabel: '2026 Annual Filing',
    dueDate: '2027-01-31',
    status: 'PENDING',
    amountDue: 0.00,
    boxValues: {
      'box1_wages': { label: 'Box 1: Wages, tips, other compensation', value: '$0.00' },
      'box2_fed_withheld': { label: 'Box 2: Federal income tax withheld', value: '$0.00' },
      'box3_ss_wages': { label: 'Box 3: Social security wages', value: '$0.00' },
      'box4_ss_tax': { label: 'Box 4: Social security tax withheld', value: '$0.00' },
      'box5_med_wages': { label: 'Box 5: Medicare wages and tips', value: '$0.00' },
      'box6_med_tax': { label: 'Box 6: Medicare tax withheld', value: '$0.00' },
      'box16_pa_wages': { label: 'Box 16: State wages (PA)', value: '$0.00' },
      'box17_pa_tax': { label: 'Box 17: State income tax (PA 3.07%)', value: '$0.00' },
      'box18_local_wages': { label: 'Box 18: Local wages, tips, etc.', value: '$0.00' },
      'box19_local_tax': { label: 'Box 19: Local income tax (EIT)', value: '$0.00' }
    }
  }
];

export function getStoredData<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return defaultVal;
  }
}

export function setStoredData<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

export type AllAppData = ReturnType<typeof loadAllAppData>;

export function loadAllAppData() {
  return {
    org: getStoredData<Organization>(STORAGE_KEYS.ORG, REAL_DEFAULT_ORG),
    employees: getStoredData<Employee[]>(STORAGE_KEYS.EMPLOYEES, REAL_DEFAULT_EMPLOYEES),
    mileageLogs: getStoredData<MileageLog[]>(STORAGE_KEYS.MILEAGE, []),
    travelExpenses: getStoredData<TravelExpense[]>(STORAGE_KEYS.TRAVEL_EXPENSES, []),
    payrollRuns: getStoredData<PayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, []),
    payStubs: getStoredData<PayStub[]>(STORAGE_KEYS.PAY_STUBS, []),
    complianceTasks: getStoredData<ComplianceTask[]>(STORAGE_KEYS.COMPLIANCE_TASKS, INITIAL_COMPLIANCE_TASKS),
    generalExpenses: getStoredData<GeneralExpense[]>(STORAGE_KEYS.GENERAL_EXPENSES, []),
  };
}

export function saveAllAppData(data: ReturnType<typeof loadAllAppData>) {
  setStoredData(STORAGE_KEYS.ORG, data.org);
  setStoredData(STORAGE_KEYS.EMPLOYEES, data.employees);
  setStoredData(STORAGE_KEYS.MILEAGE, data.mileageLogs);
  setStoredData(STORAGE_KEYS.TRAVEL_EXPENSES, data.travelExpenses);
  setStoredData(STORAGE_KEYS.PAYROLL_RUNS, data.payrollRuns);
  setStoredData(STORAGE_KEYS.PAY_STUBS, data.payStubs);
  setStoredData(STORAGE_KEYS.COMPLIANCE_TASKS, data.complianceTasks);
  setStoredData(STORAGE_KEYS.GENERAL_EXPENSES, data.generalExpenses);
}

/**
 * Clear all dummy/historical records and start a completely fresh real ledger
 */
export function clearToFreshRealApp(ownerEmail: string = 'tovijayan@gmail.com') {
  localStorage.clear();
  const cleanOrg: Organization = {
    ...REAL_DEFAULT_ORG,
    ownerEmail: ownerEmail,
  };
  const cleanData = {
    org: cleanOrg,
    employees: REAL_DEFAULT_EMPLOYEES,
    mileageLogs: [],
    travelExpenses: [],
    payrollRuns: [],
    payStubs: [],
    complianceTasks: INITIAL_COMPLIANCE_TASKS,
    generalExpenses: [],
  };
  saveAllAppData(cleanData);
  return cleanData;
}

/**
 * Load sample template calculations for reference
 */
export function loadSampleTemplate() {
  const sampleOrg: Organization = {
    ...REAL_DEFAULT_ORG,
    name: 'Vijayan Enterprise LLC',
    ownerEmail: 'tovijayan@gmail.com',
  };
  const sampleEmployees: Employee[] = [
    {
      id: 'emp_01',
      firstName: 'Arun',
      lastName: 'Kumar',
      email: 'arun.k@example.com',
      phone: '(215) 555-0182',
      ssnLastFour: '4921',
      employmentType: 'W2_HOURLY',
      payRate: 25.00,
      payFrequency: 'BI_WEEKLY',
      w4FilingStatus: 'MARRIED_FILING_JOINTLY',
      w4MultipleJobs: false,
      w4DependentCredit: 2000,
      w4OtherIncome: 0,
      w4Deductions: 0,
      w4ExtraWithholding: 0,
      paPsdCode: '460401',
      paPsdName: 'Lower Merion Twp / Montgomery',
      paResidentEitRate: 0.0100,
      paWorkPsdCode: '510101',
      paWorkEitRate: 0.0375,
      paLstAnnual: 52.00,
      paLstExempt: false,
      zelleHandle: 'arunkumar.pay@gmail.com',
      bankAccountMasked: '•••• 8821',
      isActive: true,
    }
  ];
  const sampleMileage: MileageLog[] = [
    {
      id: 'mile_01',
      employeeId: 'emp_01',
      tripDate: '2026-08-14',
      originLocation: '1500 Market St, Philadelphia, PA',
      destinationLocation: '500 North St, Harrisburg, PA (PA Dept of Revenue)',
      businessPurpose: 'PA State Tax physical document notarization & LLC administrative filing',
      startOdometer: 34120.0,
      endOdometer: 34226.5,
      calculatedMiles: 106.5,
      rateApplied: 0.67,
      mileageAllowance: 71.36,
      isReimbursableAccountablePlan: true,
      status: 'APPROVED',
      notes: 'Turnpike travel on I-76 West.',
      createdAt: new Date().toISOString(),
    }
  ];
  const sampleTravel: TravelExpense[] = [
    {
      id: 'trv_01',
      employeeId: 'emp_01',
      mileageLogId: 'mile_01',
      expenseDate: '2026-08-14',
      category: 'TOLL_ROAD',
      description: 'PA Turnpike Toll - Exit 326 Valley Forge to Exit 247 Harrisburg East',
      amount: 14.80,
      paymentSource: 'PERSONAL_OUT_OF_POCKET',
      receiptNote: 'E-ZPass Statement ref #EZ-994102-PA',
      isReimbursable: true,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    }
  ];
  const sampleGeneral: GeneralExpense[] = [
    {
      id: 'gen_01',
      expenseDate: '2026-08-01',
      category: 'LEGAL_ACCOUNTING',
      description: 'PA LLC Annual Filing Fee & Registered Agent Representation',
      amount: 250.00,
      paidBy: 'OWNER_PERSONAL',
      notes: 'Ordinary & necessary business expense for Schedule C deduction',
    }
  ];

  const sampleData = {
    org: sampleOrg,
    employees: sampleEmployees,
    mileageLogs: sampleMileage,
    travelExpenses: sampleTravel,
    payrollRuns: [],
    payStubs: [],
    complianceTasks: INITIAL_COMPLIANCE_TASKS,
    generalExpenses: sampleGeneral,
  };
  saveAllAppData(sampleData);
  return sampleData;
}

export const resetToSeedData = loadSampleTemplate;
