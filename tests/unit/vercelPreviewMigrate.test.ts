import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { resolvePreviewMigrationUrl, runPreviewMigrations } = require('../../scripts/vercel-preview-migrate.cjs');

describe('vercel-preview-migrate', () => {
  it('returns undefined and skips when VERCEL_ENV is not preview', () => {
    const env = {
      VERCEL_ENV: 'production',
      PREVIEW_DATABASE_URL: 'postgres://prev:pass@host/db',
    };
    const runCommand = vi.fn();

    expect(resolvePreviewMigrationUrl(env)).toBeUndefined();
    expect(runPreviewMigrations({ env, runCommand })).toEqual({
      executed: false,
      reason: 'not-preview',
    });
    expect(runCommand).not.toHaveBeenCalled();
  });

  it('prefers unpooled preview URLs when VERCEL_ENV is preview', () => {
    const env = {
      VERCEL_ENV: 'preview',
      PREVIEW_DATABASE_URL: 'postgres://pooled@host/db',
      PREVIEW_DATABASE_URL_UNPOOLED: 'postgres://unpooled@host/db',
    };

    expect(resolvePreviewMigrationUrl(env)).toBe('postgres://unpooled@host/db');
  });

  it('skips cleanly when preview URL is missing', () => {
    const env = { VERCEL_ENV: 'preview' };
    const runCommand = vi.fn();

    expect(runPreviewMigrations({ env, runCommand })).toEqual({
      executed: false,
      reason: 'missing-url',
    });
    expect(runCommand).not.toHaveBeenCalled();
  });

  it('runs prisma migrate deploy with DATABASE_URL set to the preview URL', () => {
    const env = {
      VERCEL_ENV: 'preview',
      PREVIEW_POSTGRES_URL_NON_POOLING: 'postgres://direct@host/prevdb',
    };
    const runCommand = vi.fn();

    const result = runPreviewMigrations({ env, runCommand });

    expect(result).toEqual({ executed: true });
    expect(runCommand).toHaveBeenCalledTimes(1);
    expect(runCommand).toHaveBeenCalledWith(
      'pnpm exec prisma migrate deploy',
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.objectContaining({
          DATABASE_URL: 'postgres://direct@host/prevdb',
        }),
      }),
    );
  });

  it('syncs TaxPack rules after migrating when TAXPACK_SERVER_URL is set', () => {
    const env = {
      VERCEL_ENV: 'preview',
      PREVIEW_POSTGRES_URL_NON_POOLING: 'postgres://direct@host/prevdb',
      TAXPACK_SERVER_URL: 'https://tax-rule-packaging-engine.vercel.app',
    };
    const runCommand = vi.fn();

    const result = runPreviewMigrations({ env, runCommand });

    expect(result).toEqual({ executed: true });
    expect(runCommand).toHaveBeenCalledTimes(2);
    expect(runCommand).toHaveBeenNthCalledWith(
      2,
      'pnpm exec tsx scripts/sync-tax-packages.ts --server "https://tax-rule-packaging-engine.vercel.app" --confirm',
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.objectContaining({
          DATABASE_URL: 'postgres://direct@host/prevdb',
        }),
      }),
    );
  });
});
