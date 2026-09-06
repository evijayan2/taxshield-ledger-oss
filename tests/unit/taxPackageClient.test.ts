import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchRemotePackageCatalog,
  fetchAndVerifyPackage,
  ingestPackageIntoLedger,
  syncAllAvailablePackages,
  getDailyPackageSyncStatus,
  triggerManualPackageSync,
} from '../../server/services/taxPackageClient.js';

describe('Tax Package Client & Ingestion Service (OSS Profile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchRemotePackageCatalog', () => {
    it('returns packages when server responds with 200 OK', async () => {
      const mockCatalog = [
        {
          packageCode: 'US-FED-2026',
          name: 'Federal 2026',
          version: '1.0.0',
          jurisdictionCode: 'US-FED',
          manifestChecksum: 'sha256:abc',
          ruleCount: 3,
          sizeBytes: 1024,
          fileName: 'US-FED-2026.taxpack.json',
          downloadUrl: '/packages/US-FED-2026.taxpack.json',
          generatedAt: '2026-01-01',
        },
      ];

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packages: mockCatalog }),
      } as any);

      const result = await fetchRemotePackageCatalog('http://localhost:3333');
      expect(result.success).toBe(true);
      expect(result.packages.length).toBe(1);
      expect(result.packages[0].packageCode).toBe('US-FED-2026');
    });

    it('returns graceful error message on connection failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await fetchRemotePackageCatalog('http://localhost:3333');
      expect(result.success).toBe(false);
      expect(result.packages).toEqual([]);
      expect(result.error).toContain('Could not connect to package server');
    });
  });

  describe('fetchAndVerifyPackage', () => {
    it('successfully parses and verifies valid package', async () => {
      const mockPkg = {
        packageCode: 'PA-STATE-2026',
        name: 'PA PIT 2026',
        version: '1.0.0',
        jurisdictionCode: 'PA',
        jurisdictions: [{ code: 'PA', name: 'Pennsylvania', level: 'STATE' }],
        rules: [{ ruleCode: 'PA_SIT_RATE', category: 'WITHHOLDING', taxType: 'STATE_INCOME_TAX', versions: [] }],
      };
      const { computePackageChecksum } = await import('../../server/services/taxPackageClient.js');
      const manifestChecksum = computePackageChecksum(mockPkg);
      const fullPkg = { ...mockPkg, manifestChecksum };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(fullPkg),
      } as any);

      const result = await fetchAndVerifyPackage('http://localhost:3333', 'PA-STATE-2026.taxpack.json');
      expect(result.success).toBe(true);
      expect(result.package?.packageCode).toBe('PA-STATE-2026');
    });

    it('rejects packages without valid manifestChecksum', async () => {
      const invalidPkg = {
        packageCode: 'BAD-PKG',
        rules: [],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(invalidPkg),
      } as any);

      const result = await fetchAndVerifyPackage('http://localhost:3333', 'BAD.taxpack.json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('verification failed');
    });
  });

  describe('ingestPackageIntoLedger', () => {
    it('supports dry-run mode without database mutations', async () => {
      const pkg = {
        packageCode: 'TX-STATE-2026',
        jurisdictionCode: 'TX',
        rules: [{ ruleCode: 'TX_SIT', versions: [{ versionCode: 'v1' }] }],
        manifestChecksum: 'sha256:dry_test',
      };

      const result = await ingestPackageIntoLedger(pkg, {
        actorId: 'test_admin',
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.rulesIngested).toBe(1);
      expect(result.versionsCreated).toBe(1);
    });
  });

  describe('Scheduler & Manual Triggering', () => {
    it('reports scheduler status structure', () => {
      const status = getDailyPackageSyncStatus();
      expect(status).toHaveProperty('isScheduled');
      expect(status).toHaveProperty('intervalMs');
      expect(status).toHaveProperty('serverUrl');
    });

    it('manually triggers package synchronization report', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packages: [] }),
      } as any);

      const result = await triggerManualPackageSync({ serverUrl: 'http://localhost:3333' });
      expect(result).toHaveProperty('totalPackages');
      expect(result).toHaveProperty('results');
    });
  });
});
