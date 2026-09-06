import { describe, it, expect } from 'vitest';
import { Employee } from 'taxshield-ledger-core';
import {
  isValidEmail,
  isValidPhoneNumber,
  formatPhoneNumber,
  isValidEin,
  formatEin,
  isValidZipCode,
} from '../../src/utils/validators.js';

/**
 * Validates a staff member input form.
 * @param data - Partial employee form input
 * @returns Validation result with error message if invalid
 */
export function validateStaffInput(data: Partial<Employee>): { isValid: boolean; error?: string } {
  if (!data.firstName?.trim() || !data.lastName?.trim()) {
    return { isValid: false, error: 'First and Last Name are required.' };
  }
  if (!isValidEmail(data.email)) {
    return { isValid: false, error: 'A valid Email Address is required (e.g., name@company.com).' };
  }
  if (data.phone && data.phone.trim() && !isValidPhoneNumber(data.phone)) {
    return { isValid: false, error: 'Please enter a valid 10-digit US Phone Number (e.g., (555) 000-0000).' };
  }
  if (data.payRate === undefined || data.payRate <= 0) {
    return { isValid: false, error: 'Pay rate must be greater than zero.' };
  }
  if (data.routingNumber && data.routingNumber.length > 0 && data.routingNumber.length !== 9) {
    return { isValid: false, error: 'ABA Routing Number must be exactly 9 digits.' };
  }
  return { isValid: true };
}

describe('Staff Form Input Validation', () => {
  const validStaff: Partial<Employee> = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '(555) 123-4567',
    payRate: 25.0,
    routingNumber: '123456789',
  };

  it('should accept valid staff input with email and phone', () => {
    const result = validateStaffInput(validStaff);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept valid staff input with empty phone', () => {
    const result = validateStaffInput({ ...validStaff, phone: '' });
    expect(result.isValid).toBe(true);
  });

  it('should reject missing or empty email', () => {
    expect(validateStaffInput({ ...validStaff, email: '' }).isValid).toBe(false);
    expect(validateStaffInput({ ...validStaff, email: '   ' }).isValid).toBe(false);
    expect(validateStaffInput({ ...validStaff, email: undefined }).isValid).toBe(false);
  });

  it('should reject invalid email formats', () => {
    expect(validateStaffInput({ ...validStaff, email: 'invalid-email' }).isValid).toBe(false);
    expect(validateStaffInput({ ...validStaff, email: 'jane@' }).isValid).toBe(false);
    expect(validateStaffInput({ ...validStaff, email: 'jane@domain' }).isValid).toBe(false);
  });

  it('should reject invalid phone numbers', () => {
    expect(validateStaffInput({ ...validStaff, phone: '123' }).isValid).toBe(false);
    expect(validateStaffInput({ ...validStaff, phone: '555-ABC-DEFG' }).isValid).toBe(false);
    expect(validateStaffInput({ ...validStaff, phone: '012-345-6789' }).isValid).toBe(false); // 0 area code
  });

  it('should reject non-positive pay rates', () => {
    expect(validateStaffInput({ ...validStaff, payRate: 0 }).isValid).toBe(false);
    expect(validateStaffInput({ ...validStaff, payRate: -10 }).isValid).toBe(false);
  });
});

describe('Email Validator Utility', () => {
  it('should validate RFC-compliant email addresses', () => {
    expect(isValidEmail('owner@acme.com')).toBe(true);
    expect(isValidEmail('jane.doe+tax@sub.domain.co.uk')).toBe(true);
    expect(isValidEmail('user123@llc.io')).toBe(true);
  });

  it('should reject invalid email formats', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('   ')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail('plainaddress')).toBe(false);
    expect(isValidEmail('@missinguser.com')).toBe(false);
    expect(isValidEmail('missingdomain@.com')).toBe(false);
  });
});

describe('Phone Number Validator & Formatter', () => {
  it('should validate 10-digit and 11-digit US phone numbers', () => {
    expect(isValidPhoneNumber('2155551234')).toBe(true);
    expect(isValidPhoneNumber('(215) 555-1234')).toBe(true);
    expect(isValidPhoneNumber('215-555-1234')).toBe(true);
    expect(isValidPhoneNumber('+1 (215) 555-1234')).toBe(true);
    expect(isValidPhoneNumber('1-215-555-1234')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhoneNumber('')).toBe(false);
    expect(isValidPhoneNumber('12345')).toBe(false);
    expect(isValidPhoneNumber('1234567890123')).toBe(false);
    expect(isValidPhoneNumber('1155551234')).toBe(false); // Area code cannot start with 1
    expect(isValidPhoneNumber('0155551234')).toBe(false); // Area code cannot start with 0
  });

  it('should format 10-digit phone numbers into (XXX) XXX-XXXX', () => {
    expect(formatPhoneNumber('2155551234')).toBe('(215) 555-1234');
    expect(formatPhoneNumber('12155551234')).toBe('(215) 555-1234');
    expect(formatPhoneNumber('(215) 555-1234')).toBe('(215) 555-1234');
  });
});

describe('EIN Validator & Formatter', () => {
  it('should validate 9-digit IRS EIN numbers', () => {
    expect(isValidEin('12-3456789')).toBe(true);
    expect(isValidEin('123456789')).toBe(true);
    expect(isValidEin('98-7654321')).toBe(true);
  });

  it('should reject invalid EIN numbers', () => {
    expect(isValidEin('')).toBe(false);
    expect(isValidEin('12-34567')).toBe(false);
    expect(isValidEin('1234567890')).toBe(false);
    expect(isValidEin('00-1234567')).toBe(false); // IRS prefix cannot be 00
    expect(isValidEin('AB-1234567')).toBe(false);
  });

  it('should format 9-digit EINs into XX-XXXXXXX', () => {
    expect(formatEin('123456789')).toBe('12-3456789');
    expect(formatEin('12-3456789')).toBe('12-3456789');
  });
});

describe('ZIP Code Validator', () => {
  it('should validate 5-digit and ZIP+4 codes', () => {
    expect(isValidZipCode('19106')).toBe(true);
    expect(isValidZipCode('19106-1234')).toBe(true);
    expect(isValidZipCode('90210')).toBe(true);
  });

  it('should reject invalid ZIP codes', () => {
    expect(isValidZipCode('')).toBe(false);
    expect(isValidZipCode('1910')).toBe(false);
    expect(isValidZipCode('191061')).toBe(false);
    expect(isValidZipCode('ABCDE')).toBe(false);
  });
});

describe('Inline Focus-Out Staff Field Validator', () => {
  it('should validate individual fields on focus out correctly', async () => {
    const { validateEmployeeField, validateEmployeeForm, getTabForField } = await import('../../src/components/staff/staffValidation.js');

    // First name & Last name
    expect(validateEmployeeField('firstName', '')).toBe('First name is required.');
    expect(validateEmployeeField('firstName', 'Jane')).toBeNull();
    expect(validateEmployeeField('lastName', '   ')).toBe('Last name is required.');
    expect(validateEmployeeField('lastName', 'Doe')).toBeNull();

    // Email
    expect(validateEmployeeField('email', '')).toBe('Email address is required.');
    expect(validateEmployeeField('email', 'not-an-email')).toBe('Please enter a valid email address (e.g., name@company.com).');
    expect(validateEmployeeField('email', 'jane@company.com')).toBeNull();

    // Phone
    expect(validateEmployeeField('phone', '')).toBeNull();
    expect(validateEmployeeField('phone', '12345')).toContain('valid 10-digit US phone number');
    expect(validateEmployeeField('phone', '(555) 123-4567')).toBeNull();

    // Age
    expect(validateEmployeeField('age', 15)).toBe('Age must be between 16 and 100.');
    expect(validateEmployeeField('age', 101)).toBe('Age must be between 16 and 100.');
    expect(validateEmployeeField('age', 30)).toBeNull();

    // SSN Last 4
    expect(validateEmployeeField('ssnLastFour', '123')).toBe('SSN Last 4 must be exactly 4 digits.');
    expect(validateEmployeeField('ssnLastFour', '12345')).toBe('SSN Last 4 must be exactly 4 digits.');
    expect(validateEmployeeField('ssnLastFour', '1234')).toBeNull();

    // Pay Rate
    expect(validateEmployeeField('payRate', 0)).toBe('Pay rate must be greater than zero.');
    expect(validateEmployeeField('payRate', -5)).toBe('Pay rate must be greater than zero.');
    expect(validateEmployeeField('payRate', 25.5)).toBeNull();

    // Routing Number
    expect(validateEmployeeField('routingNumber', '12345678')).toBe('ABA Routing Number must be exactly 9 digits.');
    expect(validateEmployeeField('routingNumber', '123456789')).toBeNull();

    // Account Number
    expect(validateEmployeeField('accountNumber', '12')).toBe('Account number must be between 4 and 17 digits.');
    expect(validateEmployeeField('accountNumber', '1234567890')).toBeNull();

    // Tab mapping
    expect(getTabForField('firstName')).toBe('personal');
    expect(getTabForField('payRate')).toBe('pay');
    expect(getTabForField('localTaxRate')).toBe('localTax');
    expect(getTabForField('w4FilingStatus')).toBe('w4');
  });

  it('should validate full form and return all active errors', async () => {
    const { validateEmployeeForm } = await import('../../src/components/staff/staffValidation.js');

    const invalidForm: any = {
      firstName: '',
      lastName: '',
      email: 'bad-email',
      payRate: 0,
      routingNumber: '123',
    };

    const errors = validateEmployeeForm(invalidForm);
    expect(errors.firstName).toBeDefined();
    expect(errors.lastName).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.payRate).toBeDefined();
    expect(errors.routingNumber).toBeDefined();
  });
});

