import { Employee, MileageLog, TravelExpense, PayStub } from '../types';

/**
 * PA Statutory State Income Tax Flat Rate
 */
export const PA_SIT_RATE = 0.0307; // 3.07%

/**
 * Social Security and Medicare statutory rates
 */
export const SOCIAL_SECURITY_RATE = 0.062; // 6.2%
export const MEDICARE_RATE = 0.0145; // 1.45%
export const PA_EMPLOYER_UC_DEFAULT_RATE = 0.03822; // 3.822% PA Employer UC standard new employer rate

/**
 * Calculate Federal Income Tax Withholding (IRS Pub 15-T Wage Bracket / Percentage Method for 2020+ W-4)
 */
export function calculateFederalIncomeTax(
  grossPay: number,
  payFrequency: Employee['payFrequency'],
  w4Status: Employee['w4FilingStatus'],
  multipleJobs: boolean,
  dependentCredit: number,
  otherIncome: number = 0,
  deductions: number = 0,
  extraWithholding: number = 0
): number {
  const periodsPerYear = {
    WEEKLY: 52,
    BI_WEEKLY: 26,
    SEMI_MONTHLY: 24,
    MONTHLY: 12
  }[payFrequency] || 26;

  // Annualize taxable wage
  const annualizedGross = (grossPay * periodsPerYear) + otherIncome - deductions;
  if (annualizedGross <= 0) return extraWithholding;

  // Standard deduction allowance under 2024/2026 rules
  let standardAllowance = 14600; // Single
  if (w4Status === 'MARRIED_FILING_JOINTLY') standardAllowance = 29200;
  if (w4Status === 'HEAD_OF_HOUSEHOLD') standardAllowance = 21900;

  if (multipleJobs) {
    standardAllowance = standardAllowance / 2;
  }

  const taxableAnnual = Math.max(0, annualizedGross - standardAllowance);
  if (taxableAnnual <= 0) return extraWithholding;

  // Federal Tax Brackets
  let annualTax = 0;
  if (w4Status === 'MARRIED_FILING_JOINTLY') {
    if (taxableAnnual <= 23200) annualTax = taxableAnnual * 0.10;
    else if (taxableAnnual <= 94300) annualTax = 2320 + (taxableAnnual - 23200) * 0.12;
    else if (taxableAnnual <= 201050) annualTax = 10852 + (taxableAnnual - 94300) * 0.22;
    else if (taxableAnnual <= 383900) annualTax = 34337 + (taxableAnnual - 201050) * 0.24;
    else annualTax = 78221 + (taxableAnnual - 383900) * 0.32;
  } else {
    // Single or Head of Household
    if (taxableAnnual <= 11600) annualTax = taxableAnnual * 0.10;
    else if (taxableAnnual <= 47150) annualTax = 1160 + (taxableAnnual - 11600) * 0.12;
    else if (taxableAnnual <= 100525) annualTax = 5426 + (taxableAnnual - 47150) * 0.22;
    else if (taxableAnnual <= 191950) annualTax = 17168.50 + (taxableAnnual - 100525) * 0.24;
    else annualTax = 39110.50 + (taxableAnnual - 191950) * 0.32;
  }

  // Factor in Step 3 Dependent Tax Credits
  annualTax = Math.max(0, annualTax - dependentCredit);

  // De-annualize back to pay period
  const periodTax = (annualTax / periodsPerYear) + extraWithholding;
  return Math.round(periodTax * 100) / 100;
}

/**
 * Compute Complete Gross-to-Net Pay & Employer Costs
 */
export function calculateGrossToNet(
  employee: Employee,
  hoursWorked: number,
  overtimeHours: number = 0,
  approvedMileageReimbursement: number = 0,
  approvedTravelReimbursement: number = 0
) {
  const regularEarnings = hoursWorked * employee.payRate;
  const overtimeEarnings = overtimeHours * (employee.payRate * 1.5);
  const grossEarnings = Math.round((regularEarnings + overtimeEarnings) * 100) / 100;

  // 1. Employee Federal Taxes
  const federalIncomeTax = calculateFederalIncomeTax(
    grossEarnings,
    employee.payFrequency,
    employee.w4FilingStatus,
    employee.w4MultipleJobs,
    employee.w4DependentCredit,
    employee.w4OtherIncome,
    employee.w4Deductions,
    employee.w4ExtraWithholding
  );

  const socialSecurityTax = Math.round(grossEarnings * SOCIAL_SECURITY_RATE * 100) / 100;
  const medicareTax = Math.round(grossEarnings * MEDICARE_RATE * 100) / 100;

  // 2. PA State & Local Withholdings
  const paStateTax = Math.round(grossEarnings * PA_SIT_RATE * 100) / 100;

  // PA Local EIT rule: Higher of Resident PSD rate or Work PSD rate
  const effectiveEitRate = Math.max(employee.paResidentEitRate, employee.paWorkEitRate);
  const paLocalEit = Math.round(grossEarnings * effectiveEitRate * 100) / 100;

  // PA LST ($52/year prorated across periods)
  const periodsPerYear = employee.payFrequency === 'WEEKLY' ? 52 : employee.payFrequency === 'BI_WEEKLY' ? 26 : employee.payFrequency === 'SEMI_MONTHLY' ? 24 : 12;
  const paLst = employee.paLstExempt ? 0 : Math.round((employee.paLstAnnual / periodsPerYear) * 100) / 100;

  const totalEmployeeTaxes = Math.round((federalIncomeTax + socialSecurityTax + medicareTax + paStateTax + paLocalEit + paLst) * 100) / 100;

  // 3. Non-Taxable Accountable Plan Reimbursements (Mileage + Tolls/Parking)
  const totalReimbursements = Math.round((approvedMileageReimbursement + approvedTravelReimbursement) * 100) / 100;

  // 4. Net Take-Home Pay (Gross - Taxes + Non-taxable Reimbursements)
  const netPay = Math.round((grossEarnings - totalEmployeeTaxes + totalReimbursements) * 100) / 100;

  // 5. Employer Side Taxes (Company Cost)
  const employerSocialSecurity = socialSecurityTax;
  const employerMedicare = medicareTax;
  const employerPaUc = Math.round(grossEarnings * PA_EMPLOYER_UC_DEFAULT_RATE * 100) / 100;
  const totalEmployerTaxes = Math.round((employerSocialSecurity + employerMedicare + employerPaUc) * 100) / 100;

  const totalCompanyCost = Math.round((grossEarnings + totalEmployerTaxes + totalReimbursements) * 100) / 100;

  return {
    grossEarnings,
    regularEarnings,
    overtimeEarnings,
    federalIncomeTax,
    socialSecurityTax,
    medicareTax,
    paStateTax,
    paLocalEit,
    effectiveEitRate,
    paLst,
    totalEmployeeTaxes,
    approvedMileageReimbursement,
    approvedTravelReimbursement,
    totalReimbursements,
    netPay,
    employerSocialSecurity,
    employerMedicare,
    employerPaUc,
    totalEmployerTaxes,
    totalCompanyCost
  };
}

/**
 * Validate IRS 5-Point Mileage Audit Readiness
 */
export function validateIrs5PointMileage(trip: Partial<MileageLog>): {
  isValid: boolean;
  score: number; // 0 to 100
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Point 1: Date
  if (trip.tripDate) score += 20;
  else missingFields.push('Point 1: Trip Date is required');

  // Point 2a & 2b: Origin & Destination
  if (trip.originLocation && trip.originLocation.trim().length > 3) score += 10;
  else missingFields.push('Point 2a: Specific Origin Address/Location required');

  if (trip.destinationLocation && trip.destinationLocation.trim().length > 3) score += 10;
  else missingFields.push('Point 2b: Specific Destination Address/Location required');

  // Point 3: Specific Business Purpose
  if (trip.businessPurpose && trip.businessPurpose.trim().length >= 8) {
    score += 20;
    const vagueKeywords = ['meeting', 'errand', 'drive', 'work', 'client', 'business'];
    if (vagueKeywords.includes(trip.businessPurpose.trim().toLowerCase())) {
      warnings.push('Business purpose is very short/vague. IRS audits require specific context (e.g., "Client contract signing & site inspection").');
    }
  } else {
    missingFields.push('Point 3: Detailed Business Purpose required');
  }

  // Point 4: Start Odometer
  if (trip.startOdometer !== undefined && trip.startOdometer > 0) score += 20;
  else missingFields.push('Point 4: Starting Odometer reading is required');

  // Point 5: End Odometer & Calculated Miles
  if (trip.endOdometer !== undefined && trip.endOdometer > (trip.startOdometer || 0)) {
    score += 20;
  } else {
    missingFields.push('Point 5: Ending Odometer must be greater than Start Odometer');
  }

  return {
    isValid: missingFields.length === 0,
    score,
    missingFields,
    warnings
  };
}

/**
 * Calculate Pass-Through Tax Benefit for Owner Form 1040 (Schedule C / Form 1065)
 */
export function calculatePassThroughSavings(
  totalGrossWages: number,
  totalEmployerTaxes: number,
  totalMileageAllowance: number,
  totalTravelExpenses: number,
  totalGeneralExpenses: number,
  ownerTaxBracketPercent: number = 24, // e.g. 24%
  ownerPaTaxRate: number = 0.0307 // 3.07% PA
) {
  // Total ordinary & necessary business expenses incurred by LLC
  const totalBusinessLossExpenses = 
    totalGrossWages + 
    totalEmployerTaxes + 
    totalMileageAllowance + 
    totalTravelExpenses + 
    totalGeneralExpenses;

  // Federal personal tax reduction
  const federalTaxSavings = totalBusinessLossExpenses * (ownerTaxBracketPercent / 100);

  // PA State personal tax reduction
  const paStateTaxSavings = totalBusinessLossExpenses * ownerPaTaxRate;

  // Total cash preserved on Personal Form 1040
  const totalEstimatedTaxSavings = federalTaxSavings + paStateTaxSavings;

  return {
    totalBusinessLossExpenses: Math.round(totalBusinessLossExpenses * 100) / 100,
    federalTaxSavings: Math.round(federalTaxSavings * 100) / 100,
    paStateTaxSavings: Math.round(paStateTaxSavings * 100) / 100,
    totalEstimatedTaxSavings: Math.round(totalEstimatedTaxSavings * 100) / 100
  };
}
