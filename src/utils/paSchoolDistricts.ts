import paSchoolDistrictsData from '../../prisma/fixtures/states/pa-school-districts.json';
import { findLocalJurisdictionByCode, findLocalJurisdictionByName } from './localTaxDistricts';

export interface PASchoolDistrict {
  name: string;
  psdCode: string;
  defaultEitRate: number; // e.g. 0.0100 for 1%
  county: string;
}

export const PA_SCHOOL_DISTRICTS: PASchoolDistrict[] = paSchoolDistrictsData as PASchoolDistrict[];

/**
 * Finds a PA School District by its 6-digit PSD code.
 */
export function findDistrictByPsdCode(code: string): PASchoolDistrict | undefined {
  if (!code) return undefined;
  const match = findLocalJurisdictionByCode(code);
  if (match && match.state === 'PA') {
    return {
      name: match.name,
      psdCode: match.code.replace('PA-PSD-', ''),
      defaultEitRate: match.defaultRate,
      county: match.county || '',
    };
  }
  return PA_SCHOOL_DISTRICTS.find(d => d.psdCode === code.trim());
}

/**
 * Finds a PA School District by exact or partial name match.
 */
export function findDistrictByName(name: string): PASchoolDistrict | undefined {
  if (!name) return undefined;
  const match = findLocalJurisdictionByName('PA', name);
  if (match) {
    return {
      name: match.name,
      psdCode: match.code.replace('PA-PSD-', ''),
      defaultEitRate: match.defaultRate,
      county: match.county || '',
    };
  }
  const clean = name.trim().toLowerCase();
  return PA_SCHOOL_DISTRICTS.find(
    d => d.name.toLowerCase() === clean || d.name.toLowerCase().includes(clean)
  );
}
