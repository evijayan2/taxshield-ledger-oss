import { isValidEmail, isValidPhoneNumber } from '../../utils/validators.js';

/**
 * Validates a single employee field on blur/focus-out.
 * @param field - The field name being validated
 * @param value - The current value of the field
 * @param _allData - Optional full employee form data context
 * @returns Error string if invalid, or null if valid
 */
export function validateEmployeeField(field: string, value: any, _allData?: Record<string, any>): string | null {
  if (field === 'firstName') {
    return !value || !String(value).trim() ? 'First name is required.' : null;
  }
  if (field === 'lastName') {
    return !value || !String(value).trim() ? 'Last name is required.' : null;
  }
  if (field === 'email') {
    if (!value || !String(value).trim()) return 'Email address is required.';
    return !isValidEmail(String(value).trim())
      ? 'Please enter a valid email address (e.g., name@company.com).'
      : null;
  }
  if (field === 'phone') {
    if (!value || !String(value).trim()) return null;
    return !isValidPhoneNumber(String(value))
      ? 'Please enter a valid 10-digit US phone number.'
      : null;
  }
  if (field === 'age') {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    return isNaN(num) || num < 16 || num > 100 ? 'Age must be between 16 and 100.' : null;
  }
  if (field === 'ssnLastFour') {
    if (!value || !String(value).trim()) return null;
    return /^\d{4}$/.test(String(value).trim()) ? null : 'SSN Last 4 must be exactly 4 digits.';
  }
  if (field === 'payRate') {
    const rate = Number(value);
    return isNaN(rate) || rate <= 0 ? 'Pay rate must be greater than zero.' : null;
  }
  if (field === 'routingNumber') {
    if (!value || !String(value).trim()) return null;
    return /^\d{9}$/.test(String(value).trim()) ? null : 'ABA Routing Number must be exactly 9 digits.';
  }
  if (field === 'accountNumber') {
    if (!value || !String(value).trim()) return null;
    const digits = String(value).trim();
    return /^\d{4,17}$/.test(digits) ? null : 'Account number must be between 4 and 17 digits.';
  }
  return null;
}

/**
 * Maps an employee field key to its corresponding modal tab key.
 * @param field - Field name
 * @returns Tab name
 */
export function getTabForField(field: string): string {
  if (['payRate', 'payFrequency', 'employmentType'].includes(field)) {
    return 'pay';
  }
  if (['localTaxRate', 'localTaxJurisdictionCode', 'localTaxJurisdictionName', 'localFlatTaxAnnual', 'localFlatTaxExempt'].includes(field)) {
    return 'localTax';
  }
  if (field.startsWith('w4') || field.startsWith('stateW4') || field === 'workState') {
    return 'w4';
  }
  return 'personal';
}

/**
 * Validates full employee form data and returns any active errors.
 * @param data - Employee form object
 * @returns Map of field name to error message
 */
export function validateEmployeeForm(data: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};
  const fieldsToCheck = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'age',
    'ssnLastFour',
    'payRate',
    'routingNumber',
    'accountNumber',
  ];

  for (const field of fieldsToCheck) {
    const error = validateEmployeeField(field, data[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}

