import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadAllAppData, clearToFreshRealApp, REAL_DEFAULT_EMPLOYEES, DEFAULT_EMPTY_ORG, isOrgConfigured } from './storage';

// In-memory mock for localStorage in node test environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

vi.stubGlobal('localStorage', mockLocalStorage);

describe('Storage Data Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty default employees and zero sample records', () => {
    expect(REAL_DEFAULT_EMPLOYEES).toEqual([]);
    const data = loadAllAppData();
    expect(data.employees).toEqual([]);
    expect(data.mileageLogs).toEqual([]);
    expect(data.travelExpenses).toEqual([]);
    expect(data.payrollRuns).toEqual([]);
    expect(data.payStubs).toEqual([]);
    expect(data.generalExpenses).toEqual([]);
    expect(data.org.name).toBe('');
  });

  it('should correctly identify configured vs unconfigured orgs', () => {
    expect(isOrgConfigured(DEFAULT_EMPTY_ORG)).toBe(false);
    expect(isOrgConfigured({ ...DEFAULT_EMPTY_ORG, name: 'Acme LLC', ein: '12-3456789' })).toBe(true);
  });

  it('should reset to a fresh clean slate when clearToFreshRealApp is invoked', () => {
    const cleanData = clearToFreshRealApp('test@example.com');
    expect(cleanData.employees).toEqual([]);
    expect(cleanData.mileageLogs).toEqual([]);
    expect(cleanData.travelExpenses).toEqual([]);
    expect(cleanData.org.ownerEmail).toBe('test@example.com');
    expect(cleanData.org.name).toBe('');
  });
});
