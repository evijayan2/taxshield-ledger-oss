import { describe, it, expect } from 'vitest';
import { Company } from 'taxshield-ledger-core';

/**
 * Resolves the display badge text for the application sidebar header.
 * @param org - Company/Organization profile
 * @returns Formatted LEDGER version label with dynamic state code
 */
export function getSidebarStateBadge(org?: Partial<Company>): string {
  const stateCode = org?.state?.trim() ? org.state.trim().toUpperCase() : 'PA';
  return `LEDGER ${stateCode} v1.0`;
}

describe('NavigationSidebar State Badge Resolution', () => {
  it('should display LEDGER DE v1.0 for Delaware companies', () => {
    const org: Partial<Company> = {
      name: 'Delaware Tech LLC',
      state: 'DE',
    };
    expect(getSidebarStateBadge(org)).toBe('LEDGER DE v1.0');
  });

  it('should display LEDGER PA v1.0 for Pennsylvania companies', () => {
    const org: Partial<Company> = {
      name: 'Philly Consulting LLC',
      state: 'PA',
    };
    expect(getSidebarStateBadge(org)).toBe('LEDGER PA v1.0');
  });

  it('should display uppercase state code for lowercase state input', () => {
    const org: Partial<Company> = {
      name: 'Miami Ventures LLC',
      state: 'fl',
    };
    expect(getSidebarStateBadge(org)).toBe('LEDGER FL v1.0');
  });

  it('should handle whitespace in state code gracefully', () => {
    const org: Partial<Company> = {
      name: 'Jersey Shore LLC',
      state: '  nj  ',
    };
    expect(getSidebarStateBadge(org)).toBe('LEDGER NJ v1.0');
  });

  it('should fallback to PA when state is missing or empty', () => {
    expect(getSidebarStateBadge(undefined)).toBe('LEDGER PA v1.0');
    expect(getSidebarStateBadge({})).toBe('LEDGER PA v1.0');
    expect(getSidebarStateBadge({ state: '' })).toBe('LEDGER PA v1.0');
    expect(getSidebarStateBadge({ state: '   ' })).toBe('LEDGER PA v1.0');
  });
});

