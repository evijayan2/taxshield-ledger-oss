import paDistrictsRaw from '../../prisma/fixtures/states/pa-school-districts.json';
import deDistrictsRaw from '../../prisma/fixtures/states/de-local-districts.json';

export interface LocalTaxJurisdiction {
  state: string;
  code: string;
  name: string;
  county?: string;
  defaultRate: number;
  taxType?: 'EIT' | 'WAGE_TAX' | 'COUNTY_TAX' | 'CITY_TAX' | 'FLAT_LST';
}

// Convert PA school district list into standardized LocalTaxJurisdiction objects
const paDistricts: LocalTaxJurisdiction[] = (paDistrictsRaw as any[]).map(d => ({
  state: 'PA',
  code: d.psdCode.length === 6 ? `PA-PSD-${d.psdCode}` : d.psdCode,
  name: d.name,
  county: d.county,
  defaultRate: d.defaultEitRate,
  taxType: 'EIT',
}));

// Load DE local jurisdictions from JSON fixture
const deDistricts: LocalTaxJurisdiction[] = (deDistrictsRaw as any[]).map(d => ({
  state: d.state || 'DE',
  code: d.code,
  name: d.name,
  county: d.county,
  defaultRate: d.defaultRate,
  taxType: d.taxType || 'EIT',
}));

const ALL_LOCAL_JURISDICTIONS: LocalTaxJurisdiction[] = [
  ...deDistricts,
  ...paDistricts,
];

/**
 * Returns all local tax jurisdictions for a specific state code.
 */
export function getLocalJurisdictionsByState(stateCode: string): LocalTaxJurisdiction[] {
  if (!stateCode) return [];
  const cleanState = stateCode.trim().toUpperCase();
  return ALL_LOCAL_JURISDICTIONS.filter(j => j.state === cleanState);
}

/**
 * Finds a local tax jurisdiction by its code (e.g. PA-PSD-150202, 150202, or DE-LOCAL-WILMINGTON).
 */
export function findLocalJurisdictionByCode(code: string): LocalTaxJurisdiction | undefined {
  if (!code) return undefined;
  const cleanCode = code.trim();
  return ALL_LOCAL_JURISDICTIONS.find(j => 
    j.code === cleanCode || 
    j.code === `PA-PSD-${cleanCode}` ||
    j.code.replace('PA-PSD-', '') === cleanCode
  );
}

/**
 * Finds a local jurisdiction by state code and district name.
 */
export function findLocalJurisdictionByName(stateCode: string, name: string): LocalTaxJurisdiction | undefined {
  if (!name) return undefined;
  const cleanState = stateCode?.trim().toUpperCase();
  const cleanName = name.trim().toLowerCase();
  
  return ALL_LOCAL_JURISDICTIONS.find(j => 
    (!cleanState || j.state === cleanState) &&
    (j.name.toLowerCase() === cleanName || j.name.toLowerCase().includes(cleanName))
  );
}

/**
 * Returns all supported local tax jurisdictions across all states.
 */
export function getAllLocalJurisdictions(): LocalTaxJurisdiction[] {
  return ALL_LOCAL_JURISDICTIONS;
}
