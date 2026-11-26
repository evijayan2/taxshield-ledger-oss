#!/usr/bin/env node
const { execSync } = require('child_process');

/**
 * Resolves the direct (non-pooling preferred) database URL for Vercel preview migrations.
 * @param {Record<string, string | undefined>} [env]
 * @returns {string | undefined}
 */
function resolvePreviewMigrationUrl(env = process.env) {
  if (env.VERCEL_ENV !== 'preview') {
    return undefined;
  }

  return (
    env.PREVIEW_DATABASE_URL_UNPOOLED ||
    env.PREVIEW_POSTGRES_URL_NON_POOLING ||
    env.PREVIEW_DATABASE_URL ||
    env.PREVIEW_POSTGRES_PRISMA_URL ||
    env.PREVIEW_POSTGRES_URL ||
    env.DATABASE_URL
  );
}

/**
 * Runs `prisma migrate deploy` against the preview database when building in Vercel Preview.
 * @param {object} [options]
 * @param {Record<string, string | undefined>} [options.env]
 * @param {(cmd: string, execOpts: object) => void} [options.runCommand]
 * @returns {{ executed: boolean; reason?: string }}
 */
function runPreviewMigrations(options = {}) {
  const env = options.env || process.env;
  const runCommand =
    options.runCommand ||
    ((cmd, execOpts) => {
      execSync(cmd, execOpts);
    });

  if (env.VERCEL_ENV !== 'preview') {
    return { executed: false, reason: 'not-preview' };
  }

  const migrationUrl = resolvePreviewMigrationUrl(env);
  if (!migrationUrl) {
    console.warn('[vercel-preview-migrate] VERCEL_ENV=preview but no PREVIEW_* database URL found; skipping migrations.');
    return { executed: false, reason: 'missing-url' };
  }

  console.log('[vercel-preview-migrate] Applying Prisma migrations to Vercel preview database...');
  const migrateEnv = { ...env, DATABASE_URL: migrationUrl };

  try {
    runCommand('pnpm exec prisma migrate deploy', { stdio: 'inherit', env: migrateEnv });
  } catch (err) {
    // Fallback to npx if pnpm is unavailable in the build container
    if (err && typeof err.message === 'string' && err.message.includes('pnpm')) {
      runCommand('npx prisma migrate deploy', { stdio: 'inherit', env: migrateEnv });
    } else {
      throw err;
    }
  }

  return { executed: true };
}

if (require.main === module) {
  runPreviewMigrations();
}

module.exports = {
  resolvePreviewMigrationUrl,
  runPreviewMigrations,
};
