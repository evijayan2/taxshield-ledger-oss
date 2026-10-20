import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TaxImpactSimulatorView } from '../../src/components/TaxImpactSimulatorView';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

describe('TaxImpactSimulatorView', () => {
  it('should render successfully with a valid company prop', () => {
    const mockCompany = {
      id: 'comp_test',
      name: 'Test LLC',
      ein: '12-3456789',
      stateTaxId: '9876543',
      address: '123 Main St',
      city: 'Lancaster',
      state: 'PA',
      zip: '17601',
      ownerName: 'Jane Doe',
      ownerEmail: 'jane@example.com',
      ownerTaxBracket: 24,
    };

    const html = renderToStaticMarkup(
      React.createElement(TaxImpactSimulatorView, { company: mockCompany })
    );

    expect(html).toContain('Advanced Tax Impact Simulator');
    expect(html).toContain('Company Tax Jurisdiction State');
    expect(html).toContain('Monthly Tax Filing Schedule');
    expect(html).toContain('Monthly (12)');
    expect(html).toContain('Net Business Profit');
  });

  it('should render safely without throwing when company is undefined or unconfigured', () => {
    expect(() => {
      const html = renderToStaticMarkup(
        React.createElement(TaxImpactSimulatorView, { company: undefined })
      );
      expect(html).toContain('Advanced Tax Impact Simulator');
    }).not.toThrow();
  });

  it('should restrict state jurisdiction options strictly to company address history', () => {
    const mockCompanyWithHistory = {
      id: 'comp_test_hist',
      name: 'Multi-State LLC',
      ein: '12-3456789',
      stateTaxId: '9876543',
      address: '123 Main St',
      city: 'Lancaster',
      state: 'PA',
      zip: '17601',
      ownerName: 'Jane Doe',
      ownerEmail: 'jane@example.com',
      addressHistory: [
        { id: 'addr_1', companyId: 'comp_test_hist', streetAddress: '456 Market St', city: 'Wilmington', state: 'DE', zip: '19801', workEitRate: 0, effectiveDate: '2024-01-01' },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(TaxImpactSimulatorView, { company: mockCompanyWithHistory })
    );

    expect(html).toContain('Pennsylvania (PA)');
    expect(html).toContain('Delaware (DE)');
    // Should NOT contain arbitrary unrecorded states like California or Texas
    expect(html).not.toContain('California (CA)');
    expect(html).not.toContain('Texas (TX)');
  });

  it('should update state via getDerivedStateFromError when a child component fails', () => {
    const testError = new Error('Test component explosion');
    const derivedState = ErrorBoundary.getDerivedStateFromError(testError);
    expect(derivedState.hasError).toBe(true);
    expect(derivedState.error?.message).toBe('Test component explosion');
  });
});
