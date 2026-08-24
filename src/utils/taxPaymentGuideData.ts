export interface TaxRemittanceInfo {
  id: string;
  jurisdictionCode: string;
  title: string;
  agencyName: string;
  formIdentifier: string;
  formTitle: string;
  depositFrequency: string;
  dueDateRule: string;
  portalName: string;
  portalUrl: string;
  paymentMethods: string[];
  componentsIncluded: Array<{
    name: string;
    rateOrCalculation: string;
    paidBy: 'EMPLOYEE' | 'EMPLOYER' | 'BOTH';
  }>;
  stepByStepInstructions: string[];
  filingPreparationNotes: string[];
}

export const TAX_REMITTANCE_GUIDES: Record<string, TaxRemittanceInfo> = {
  FEDERAL_941: {
    id: 'FEDERAL_941',
    jurisdictionCode: 'FEDERAL_IRS',
    title: 'Federal Payroll Taxes (Form 941 Deposit)',
    agencyName: 'Internal Revenue Service (IRS) & U.S. Treasury',
    formIdentifier: 'FORM_941',
    formTitle: 'IRS Form 941 (Employer Quarterly Federal Tax Return)',
    depositFrequency: 'Monthly (or Semi-Weekly depending on prior lookback liability)',
    dueDateRule: 'Monthly deposits due by the 15th of the month following pay date. Form 941 due quarterly (Apr 30, Jul 31, Oct 31, Jan 31).',
    portalName: 'IRS Electronic Federal Tax Payment System (EFTPS)',
    portalUrl: 'https://www.eftps.gov',
    paymentMethods: ['EFTPS ACH Direct Debit', 'EFTPS Same-Day Wire', 'Approved Payroll Tax Software'],
    componentsIncluded: [
      { name: 'Federal Income Tax (FIT)', rateOrCalculation: 'W-4 bracket formula withheld from paystubs', paidBy: 'EMPLOYEE' },
      { name: 'Employee Social Security Tax', rateOrCalculation: '6.2% on wages up to wage base limit', paidBy: 'EMPLOYEE' },
      { name: 'Employer Social Security Matching', rateOrCalculation: '6.2% employer matching contribution', paidBy: 'EMPLOYER' },
      { name: 'Employee Medicare Tax', rateOrCalculation: '1.45% on gross wages', paidBy: 'EMPLOYEE' },
      { name: 'Employer Medicare Matching', rateOrCalculation: '1.45% employer matching contribution', paidBy: 'EMPLOYER' },
    ],
    stepByStepInstructions: [
      'Log into EFTPS.gov using your EIN, PIN, and Internet Password.',
      'Select "Make a Payment" and choose Tax Form "941 - Employer\'s QUARTERLY Federal Tax Return".',
      'Enter the tax period (e.g., 3rd Quarter 2026) and exact deposit liability amount.',
      'Specify the settlement date (must schedule before 8:00 PM ET the business day prior to due date).',
      'Save and print the 12-digit EFTPS Electronic Payment Confirmation Number for your audit trail.',
      'File IRS Form 941 quarterly (or provide pre-filled box mapping values from TaxShield to your tax filing software/CPA).'
    ],
    filingPreparationNotes: [
      'Box 2: Sum of all Federal Income Tax withheld from employee paystubs.',
      'Box 5a: Total taxable Social Security wages multiplied by 12.4% (6.2% EE + 6.2% ER).',
      'Box 5c: Total taxable Medicare wages multiplied by 2.9% (1.45% EE + 1.45% ER).',
      'Box 10: Total Tax Liability = Box 2 + Box 5a + Box 5c.',
      'Box 13: Total deposits paid through EFTPS for the quarter. Should equal Box 10 (balance due = $0.00).'
    ]
  },
  PA_SIT_REV1667: {
    id: 'PA_SIT_REV1667',
    jurisdictionCode: 'PA_MYPATH_SIT',
    title: 'PA State Income Tax Withholding (Form REV-1667)',
    agencyName: 'Pennsylvania Department of Revenue',
    formIdentifier: 'REV_1667',
    formTitle: 'PA Form REV-1667 (Quarterly/Monthly Employer Withholding Return)',
    depositFrequency: 'Monthly (or Semi-Monthly / Quarterly based on withholding threshold)',
    dueDateRule: 'Monthly returns due by the 15th of the month following pay date. Quarterly returns due by last day of month following quarter end.',
    portalName: 'PA Department of Revenue myPATH Portal',
    portalUrl: 'https://mypath.pa.gov',
    paymentMethods: ['myPATH Electronic Debit (ACH Direct)', 'Credit/Debit Card (fee applies)', 'Paper Check with Voucher'],
    componentsIncluded: [
      { name: 'PA State Income Tax (SIT)', rateOrCalculation: '3.07% statutory flat rate on PA taxable wages', paidBy: 'EMPLOYEE' }
    ],
    stepByStepInstructions: [
      'Log into myPATH (mypath.pa.gov) with your PA Employer Account login.',
      'Under the "Employer Withholding Tax" panel, click "File/Pay Return".',
      'Select the filing period (e.g. Monthly or Q3 2026).',
      'Enter Total PA Gross Compensation and exact 3.07% PA Tax Withheld from TaxShield summary.',
      'Select Payment Method (ACH Direct Debit) and submit payment.',
      'Record the myPATH Confirmation Number in TaxShield to mark compliance task as Filed.'
    ],
    filingPreparationNotes: [
      'PA State Income Tax is a strict 3.07% flat tax on taxable compensation.',
      'Gross compensation includes regular pay and overtime, minus exempt retirement contributions if applicable under PA rules.',
      'Form REV-1667 transmittal summary text file can be downloaded directly from TaxShield.'
    ]
  },
  PA_UC2: {
    id: 'PA_UC2',
    jurisdictionCode: 'PA_MYPATH_UC',
    title: 'PA Unemployment Compensation Tax (Form UC-2 / UC-2A)',
    agencyName: 'PA Dept of Labor & Industry (Office of Unemployment Compensation)',
    formIdentifier: 'PA_UC_2',
    formTitle: 'PA Form UC-2 (Employer Tax Report) & UC-2A (Wage Record)',
    depositFrequency: 'Quarterly',
    dueDateRule: 'Due quarterly by April 30, July 31, October 31, and January 31.',
    portalName: 'PA Unemployment Compensation Management System (UCMS / myPATH)',
    portalUrl: 'https://www.uc.pa.gov',
    paymentMethods: ['UCMS Electronic ACH Debit', 'Credit Card', 'Paper Check with UC-2 Voucher'],
    componentsIncluded: [
      { name: 'Employer UC Contribution', rateOrCalculation: 'Employer UC rate (e.g. 3.822% standard new employer rate) up to $10,000 wage base limit per employee', paidBy: 'EMPLOYER' },
      { name: 'Employee UC Tax Withholding', rateOrCalculation: '0.07% PA employee tax deducted from gross wages', paidBy: 'EMPLOYEE' }
    ],
    stepByStepInstructions: [
      'Log into the PA Unemployment Compensation Management System (UCMS) at uc.pa.gov.',
      'Select "File Quarterly Tax & Wage Report" for the target quarter.',
      'Enter total gross wages paid and individual employee SSN, name, and covered UC wages.',
      'System calculates employer tax (3.822%) + employee tax (0.07%).',
      'Authorize electronic ACH debit for total tax due.',
      'Save submission confirmation receipt and record confirmation number in TaxShield.'
    ],
    filingPreparationNotes: [
      'PA UC applies to the first $10,000 of wages per employee per calendar year.',
      'Both employer contribution and employee tax withholding must be remitted on Form UC-2.'
    ]
  },
  PA_LOCAL_EIT: {
    id: 'PA_LOCAL_EIT',
    jurisdictionCode: 'PA_LOCAL_COLLECTOR',
    title: 'PA Local Earned Income Tax (EIT) & LST Withholding',
    agencyName: 'Local Tax Collector (Keystone Collections / Berkheimer / Jordan Tax)',
    formIdentifier: 'PA_LOCAL_EIT',
    formTitle: 'Quarterly Local Earned Income Tax Employer Return',
    depositFrequency: 'Quarterly',
    dueDateRule: 'Due within 30 days after the end of each calendar quarter (Apr 30, Jul 31, Oct 31, Jan 31).',
    portalName: 'Local Tax Collector Electronic Filing Portal (e.g. Keystone Pay Portal)',
    portalUrl: 'https://pay.keystonecollects.com',
    paymentMethods: ['Collector Portal ACH Debit', 'Electronic Check', 'Paper Remittance Form'],
    componentsIncluded: [
      { name: 'Local Earned Income Tax (EIT)', rateOrCalculation: 'Resident vs Work PSD rate (typically 1.0% to 2.0% of gross wages)', paidBy: 'EMPLOYEE' },
      { name: 'Local Services Tax (LST)', rateOrCalculation: '$52.00 annual rate ($1.00/week or $2.00/bi-weekly)', paidBy: 'EMPLOYEE' }
    ],
    stepByStepInstructions: [
      'Identify the assigned tax collector for your work location PSD code (e.g. Keystone Collections Group or Berkheimer).',
      'Log into the collector portal using your employer account ID / Federal EIN.',
      'File the Quarterly Employer Return by entering total local taxable wages and local tax withheld.',
      'Remit payment for combined Local EIT and Local Services Tax (LST).',
      'Keep filing confirmation receipt for your business ledger audit log.'
    ],
    filingPreparationNotes: [
      'Under PA Act 32, employers must withhold the higher of the employee resident EIT rate or the work location EIT rate.',
      'LST is withheld at $1.00/week ($2.00 per bi-weekly paystub) unless employee submits an exemption certificate.'
    ]
  },
  W2_W3_BUNDLE: {
    id: 'W2_W3_BUNDLE',
    jurisdictionCode: 'SSA_W2',
    title: 'Annual Wage Statements (Forms W-2 & W-3 Bundle)',
    agencyName: 'Social Security Administration (SSA) & PA Dept of Revenue',
    formIdentifier: 'W2_W3',
    formTitle: 'Year-End Forms W-2 / W-3 Transmittal Package',
    depositFrequency: 'Annual Filing',
    dueDateRule: 'Due by January 31 following the tax year end to both SSA and employees.',
    portalName: 'SSA Business Services Online (BSO) & PA myPATH',
    portalUrl: 'https://www.ssa.gov/bso',
    paymentMethods: ['No direct tax payment (Informational Return)', 'Remit any tax reconciliation balance if applicable'],
    componentsIncluded: [
      { name: 'Form W-2 Copy A, B, C, 2', rateOrCalculation: 'Annual wage & tax summary per employee', paidBy: 'EMPLOYEE' },
      { name: 'Form W-3 Transmittal', rateOrCalculation: 'Summary transmittal of all W-2 forms for employer', paidBy: 'EMPLOYER' }
    ],
    stepByStepInstructions: [
      'Click "Generate W-2 / W-3 PDFs" in TaxShield to generate and download official IRS/SSA compliant PDF package.',
      'Deliver Copy B & C to each employee by January 31.',
      'Log into SSA Business Services Online (ssa.gov/bso) to upload electronic W-2 file or fill online wage report.',
      'Log into PA myPATH (mypath.pa.gov) to upload annual PA W-2 state copy.',
      'Record transmittal confirmation numbers in TaxShield.'
    ],
    filingPreparationNotes: [
      'Box 1 Wages, Box 2 FIT, Box 3 SS Wages, Box 4 SS Tax, Box 5 Med Wages, Box 6 Med Tax are auto-calculated from paystubs.',
      'PA State wages (Box 16) and PA State tax (Box 17) match PA Department of Revenue standards.'
    ]
  }
};
