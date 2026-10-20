import { Employee } from '../../types';
import { findDistrictByPsdCode } from '../../utils/paSchoolDistricts';
import { getLocalJurisdictionsByState } from '../../utils/localTaxDistricts';

/**
 * Creates default employee form values tailored to the active company state.
 */
export function createDefaultEmployeeForm(companyState: string = 'DE'): Omit<Employee, 'id'> {
  const cleanCompState = (companyState || 'DE').trim().toUpperCase();
  const isPA = cleanCompState === 'PA';
  const isDE = cleanCompState === 'DE';

  let localCode = '';
  let localName = 'None / Out of Area';

  if (isPA) {
    localCode = 'PA-PSD-460401';
    localName = 'Lower Merion School District';
  } else if (isDE) {
    localCode = 'DE-LOCAL-WILMINGTON';
    localName = 'City of Wilmington';
  }

  return {
    firstName: '',
    lastName: '',
    age: 30,
    relationshipToOwner: 'NONE',
    email: '',
    phone: '',
    ssnLastFour: '',
    streetAddress: '',
    city: '',
    state: cleanCompState,
    zip: '',
    workState: cleanCompState,
    employmentType: 'W2_HOURLY',
    payRate: 25.0,
    payFrequency: 'BI_WEEKLY',
    w4FilingStatus: 'SINGLE',
    w4MultipleJobs: false,
    w4DependentCredit: 0,
    w4OtherIncome: 0,
    w4Deductions: 0,
    w4ExtraWithholding: 0,
    localTaxJurisdictionCode: localCode,
    localTaxJurisdictionName: localName,
    // Jurisdiction is an employee fact; statutory values resolve from tax rules.
    localFlatTaxExempt: !isPA,
    paPsdCode: undefined,
    paPsdName: undefined,
    paWorkPsdCode: undefined,
    paLstExempt: !isPA,
    bankName: '',
    accountType: 'CHECKING',
    routingNumber: '',
    accountNumber: '',
    bankAccountMasked: '',
    isActive: true,
  };
}

/**
 * Returns updated tax jurisdiction fields when an employee's residence state changes.
 */
export function getTaxDefaultsForResidenceState(
  newResidenceState: string,
  currentWorkState?: string
): Partial<Employee> {
  const cleanResState = (newResidenceState || '').trim().toUpperCase();
  const isPA = cleanResState === 'PA';
  const isDE = cleanResState === 'DE';

  if (isPA) {
    return {
      state: 'PA',
      localTaxJurisdictionCode: '',
      localTaxJurisdictionName: 'None / Out of Area',
      localFlatTaxExempt: true,
      paPsdCode: undefined,
      paPsdName: undefined,
      paLstExempt: false,
    };
  }

  if (isDE) {
    return {
      state: 'DE',
      localTaxJurisdictionCode: 'DE-LOCAL-WILMINGTON',
      localTaxJurisdictionName: 'City of Wilmington',
      localFlatTaxExempt: true,
      paPsdCode: undefined,
      paPsdName: undefined,
      paResidentEitRate: undefined,
      paLstAnnual: undefined,
    };
  }

  // Check if state has any registered local tax districts
  const districts = getLocalJurisdictionsByState(cleanResState);
  if (districts.length > 0) {
    const first = districts[0];
    return {
      state: cleanResState,
      localTaxJurisdictionCode: first.code,
      localTaxJurisdictionName: first.name,
      localFlatTaxExempt: true,
      paPsdCode: undefined,
      paPsdName: undefined,
      paResidentEitRate: undefined,
      paLstAnnual: undefined,
    };
  }

  return {
    state: cleanResState,
    localTaxJurisdictionCode: '',
    localTaxJurisdictionName: 'None / Out of Area',
    localFlatTaxExempt: true,
    paPsdCode: undefined,
    paPsdName: undefined,
    paResidentEitRate: undefined,
    paLstAnnual: undefined,
  };
}
