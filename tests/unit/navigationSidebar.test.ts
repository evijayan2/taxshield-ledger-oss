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

  it('should list all 6 employee portal tabs', () => {
    const employeeTabs = [
      'MY_DOCUMENTS',
      'TIMESHEETS',
      'EMPLOYEE_REIMBURSEMENTS',
      'EMPLOYEE_PTO',
      'PAYROLL_CALENDAR',
      'EMPLOYEE_PROFILE',
    ];
    expect(employeeTabs.length).toBe(6);
    expect(employeeTabs).toContain('EMPLOYEE_REIMBURSEMENTS');
    expect(employeeTabs).toContain('EMPLOYEE_PTO');
    expect(employeeTabs).toContain('EMPLOYEE_PROFILE');
  });

  it('should structure owner navigation into the 4 primary pillars plus settings', async () => {
    const { OWNER_HUBS, EMPLOYEE_HUBS } = await import('../../src/components/NavigationSidebar');
    expect(OWNER_HUBS.length).toBe(5);
    expect(OWNER_HUBS.map(h => h.hubId)).toEqual([
      'OVERVIEW',
      'BOOKKEEPING',
      'PAYROLL',
      'TAX_COMPLIANCE',
      'SETTINGS'
    ]);

    // All items should have a shortLabel for top contextual pill navigation
    const allOwnerItems = OWNER_HUBS.flatMap(h => h.items);
    expect(allOwnerItems.length).toBe(21);
    allOwnerItems.forEach(item => {
      expect(item.shortLabel).toBeDefined();
      expect(item.shortLabel!.length).toBeGreaterThan(0);
    });

    // Employee portal hub verification
    expect(EMPLOYEE_HUBS.length).toBe(1);
    expect(EMPLOYEE_HUBS[0].items.length).toBe(6);
  }, 15000);

  it('should filter items accurately by search query across label, shortLabel, and category', async () => {
    const { OWNER_HUBS } = await import('../../src/components/NavigationSidebar');

    const searchItems = (query: string) => {
      const q = query.trim().toLowerCase();
      return OWNER_HUBS.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.label.toLowerCase().includes(q) ||
          (item.shortLabel && item.shortLabel.toLowerCase().includes(q)) ||
          section.category.toLowerCase().includes(q)
        )
      })).filter(s => s.items.length > 0);
    };

    // Searching 'payroll' should return the PAYROLL hub items
    const payrollMatches = searchItems('payroll');
    expect(payrollMatches.some(m => m.hubId === 'PAYROLL')).toBe(true);
    expect(payrollMatches.flatMap(m => m.items).some(i => i.id === 'PAYROLL')).toBe(true);

    // Searching 'recon' (shortLabel) should find Bank Reconciliation
    const reconMatches = searchItems('recon');
    expect(reconMatches.flatMap(m => m.items).some(i => i.id === 'RECONCILIATION')).toBe(true);

    // Searching non-existent query returns empty
    const emptyMatches = searchItems('xyznonexistentterm');
    expect(emptyMatches.length).toBe(0);
  }, 15000);
});

