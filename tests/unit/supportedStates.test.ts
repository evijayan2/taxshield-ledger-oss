import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_STATES,
  getSupportedStates,
  isStateSupported,
  getSupportedStateByCode,
  getStateDisplayName,
} from '../../src/utils/supportedStates.js';

describe('Supported States & Tax Rules Registry', () => {
  it('should list all states with active tax calculation fixtures', () => {
    const states = getSupportedStates();
    const codes = states.map((s) => s.code);
    expect(codes).toContain('PA');
    expect(codes).toContain('DE');
    expect(codes).toContain('FL');
    expect(codes).toContain('NJ');
    expect(codes).toContain('NY');
    expect(codes).toContain('OH');
    expect(codes).toContain('TX');
    expect(states.length).toBe(7);
  });

  it('should have complete metadata for every supported state', () => {
    for (const st of SUPPORTED_STATES) {
      expect(st.code).toBeTruthy();
      expect(st.name).toBeTruthy();
      expect(st.fullName).toBeTruthy();
      expect(typeof st.hasStateIncomeTax).toBe('boolean');
      expect(typeof st.hasLocalIncomeTax).toBe('boolean');
      expect(st.defaultFilingFrequency).toMatch(/^(MONTHLY|QUARTERLY|SEMI_MONTHLY|ANNUALLY)$/);
      expect(st.taxDescription).toBeTruthy();
    }
  });

  it('should correctly identify supported vs unsupported states case-insensitively', () => {
    expect(isStateSupported('PA')).toBe(true);
    expect(isStateSupported('pa')).toBe(true);
    expect(isStateSupported(' Nj ')).toBe(true);
    expect(isStateSupported('tx')).toBe(true);
    expect(isStateSupported('FL')).toBe(true);

    // Unsupported states without active tax fixtures
    expect(isStateSupported('CA')).toBe(false);
    expect(isStateSupported('WA')).toBe(false);
    expect(isStateSupported('ZZ')).toBe(false);
    expect(isStateSupported('')).toBe(false);
  });

  it('should lookup state metadata by code', () => {
    const pa = getSupportedStateByCode('PA');
    expect(pa).toBeDefined();
    expect(pa?.name).toBe('Pennsylvania');
    expect(pa?.hasStateIncomeTax).toBe(true);
    expect(pa?.hasLocalIncomeTax).toBe(true);

    const tx = getSupportedStateByCode('tx');
    expect(tx).toBeDefined();
    expect(tx?.name).toBe('Texas');
    expect(tx?.hasStateIncomeTax).toBe(false);

    expect(getSupportedStateByCode('UNKNOWN')).toBeUndefined();
  });

  it('should return display name and fallback gracefully', () => {
    expect(getStateDisplayName('PA')).toBe('Commonwealth of Pennsylvania (PA)');
    expect(getStateDisplayName('nj')).toBe('State of New Jersey (NJ)');
    expect(getStateDisplayName('CA')).toBe('CA');
  });
});
