import { describe, it, expect } from 'vitest';
import { 
  generateW9TokenPair, 
  evaluateContractor1099Status, 
  isCorporateExempt,
  Employee,
  FormW9Record,
  ContractorPayment
} from 'taxshield-ledger-core';

interface NewContractorInput {
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
  phone?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContractorInput(input: NewContractorInput): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.firstName?.trim()) errors.firstName = 'First name is required';
  if (!input.lastName?.trim()) errors.lastName = 'Last name is required';
  if (!input.email?.trim()) {
    errors.email = 'Email address is required';
  } else if (!EMAIL_REGEX.test(input.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

function createContractorEmployee(input: NewContractorInput, id: string): Employee {
  return {
    id,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || '',
    ssnLastFour: '',
    employmentType: '1099_CONTRACTOR',
    payRate: 0,
    payFrequency: 'BI_WEEKLY',
    w4FilingStatus: 'SINGLE',
    w4MultipleJobs: false,
    w4DependentCredit: 0,
    w4OtherIncome: 0,
    w4Deductions: 0,
    w4ExtraWithholding: 0,
    isActive: true,
  };
}

describe('Contractor Hub & W-9 Onboarding Workflow', () => {
  it('should validate required contractor details', () => {
    const invalidInput: NewContractorInput = {
      firstName: '',
      lastName: '',
      email: 'not-an-email',
    };
    const { isValid, errors } = validateContractorInput(invalidInput);
    expect(isValid).toBe(false);
    expect(errors.firstName).toBe('First name is required');
    expect(errors.lastName).toBe('Last name is required');
    expect(errors.email).toBe('Please enter a valid email address');
  });

  it('should successfully validate complete contractor details', () => {
    const validInput: NewContractorInput = {
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex@designstudio.io',
      businessName: 'Morgan Creative Studio',
      phone: '(215) 555-0199',
    };
    const { isValid, errors } = validateContractorInput(validInput);
    expect(isValid).toBe(true);
    expect(Object.keys(errors).length).toBe(0);
  });

  it('should construct a valid 1099_CONTRACTOR employee record', () => {
    const input: NewContractorInput = {
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah@skynet-consulting.com',
      phone: '215-555-3456',
    };
    const contractor = createContractorEmployee(input, 'contractor_123');
    expect(contractor.id).toBe('contractor_123');
    expect(contractor.employmentType).toBe('1099_CONTRACTOR');
    expect(contractor.payFrequency).toBe('BI_WEEKLY');
    expect(contractor.firstName).toBe('Sarah');
    expect(contractor.lastName).toBe('Connor');
    expect(contractor.email).toBe('sarah@skynet-consulting.com');
    expect(contractor.phone).toBe('215-555-3456');
    expect(contractor.isActive).toBe(true);
  });

  it('should generate a valid single-use W-9 token pair and link', () => {
    const { rawToken, tokenHash } = generateW9TokenPair();
    expect(rawToken).toBeDefined();
    expect(rawToken.length).toBe(64); // 32 bytes hex
    expect(tokenHash).toBeDefined();
    expect(tokenHash.length).toBe(64); // SHA-256 hex
    expect(rawToken).not.toBe(tokenHash);

    const inviteUrl = `http://localhost:5173/onboard/w9?token=${rawToken}`;
    expect(inviteUrl).toContain('/onboard/w9?token=');
  });

  it('should evaluate 1099 compliance status across lifecycle stages', () => {
    // 1. New contractor with payments but no W-9
    const missingStatus = evaluateContractor1099Status(750, 600, false, undefined);
    expect(missingStatus).toBe('MISSING_W9');

    // 2. Contractor with certified W-9 but below $600 statutory threshold
    const belowStatus = evaluateContractor1099Status(450, 600, true, 'INDIVIDUAL_SOLE_PROPRIETOR');
    expect(belowStatus).toBe('BELOW_THRESHOLD');

    // 3. Contractor with certified W-9 reaching $600 threshold
    const readyStatus = evaluateContractor1099Status(600, 600, true, 'INDIVIDUAL_SOLE_PROPRIETOR');
    expect(readyStatus).toBe('THRESHOLD_MET');

    // 4. Corporate entity (C-Corp or S-Corp) is exempt from 1099-NEC
    expect(isCorporateExempt('C_CORPORATION')).toBe(true);
    expect(isCorporateExempt('S_CORPORATION')).toBe(true);
    expect(isCorporateExempt('INDIVIDUAL_SOLE_PROPRIETOR')).toBe(false);

    const exemptStatus = evaluateContractor1099Status(5000, 600, true, 'C_CORPORATION');
    expect(exemptStatus).toBe('EXEMPT_ENTITY');
  });
});
