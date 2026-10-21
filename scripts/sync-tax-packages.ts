#!/usr/bin/env tsx
import 'dotenv/config';
import {
  syncAllAvailablePackages,
  fetchRemotePackageCatalog,
  getDailyPackageSyncStatus,
  type IIngestionOptions,
} from '../server/services/taxPackageClient.js';

/**
 * CLI script to ingest regulatory tax rule packages into TaxShield Ledger OSS database.
 * Usage:
 *   pnpm tsx scripts/sync-tax-packages.ts [--server https://tax-rule-packaging-engine.vercel.app] [--confirm] [--dry-run] [--staged]
 */
async function main() {
  const args = process.argv.slice(2);
  const serverIndex = args.indexOf('--server');
  const serverUrl =
    serverIndex !== -1 && args[serverIndex + 1]
      ? args[serverIndex + 1]
      : process.env.TAXPACK_SERVER_URL ||
        process.env.TAX_PACKAGE_SERVER_URL ||
        'https://tax-rule-packaging-engine.vercel.app';
  const hasConfirm = args.includes('--confirm');
  const hasDryRun = args.includes('--dry-run');
  const hasStaged = args.includes('--staged');

  console.log('='.repeat(70));
  console.log(' TaxShield Ledger OSS — Tax Rule Package Sync CLI');
  console.log('='.repeat(70));
  console.log(` Target Server:  ${serverUrl}`);
  console.log(` Execution Mode: ${hasDryRun ? 'DRY-RUN (Verification Only)' : (hasConfirm ? 'LIVE DATABASE WRITE' : 'SAFETY BLOCKED')}`);
  console.log(` Activation:     ${hasStaged ? 'STAGED (IN_REVIEW)' : 'IMMEDIATE (ACTIVE)'}`);
  console.log('-'.repeat(70));

  if (!hasConfirm && !hasDryRun) {
    console.error('\n❌ SAFETY GUARDRAIL: Writing to database requires explicit confirmation.');
    console.error('   Please run with --confirm to write to PostgreSQL, or --dry-run to verify without writing.\n');
    process.exit(1);
  }

  console.log('\n🔍 Discovering remote packages...');
  const catalog = await fetchRemotePackageCatalog(serverUrl);
  if (!catalog.success) {
    console.error(`\n❌ Failed to connect to package distribution server: ${catalog.error}`);
    process.exit(1);
  }

  console.log(`✓ Discovered ${catalog.packages.length} sealed regulatory packages:\n`);
  for (const pkg of catalog.packages) {
    console.log(`  • [${pkg.packageCode}] ${pkg.name} (v${pkg.version})`);
    console.log(`    Rules: ${pkg.ruleCount} | Checksum: ${pkg.manifestChecksum}`);
    console.log(`    Download: ${pkg.downloadUrl}\n`);
  }

  const options: IIngestionOptions = {
    actorId: 'cli_admin_operator',
    activateImmediately: !hasStaged,
    dryRun: hasDryRun,
  };

  console.log(`🚀 Ingesting and verifying all packages from ${serverUrl}...`);
  const startTime = Date.now();
  const batchReport = await syncAllAvailablePackages(serverUrl, options);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(70));
  console.log(' Ingestion Summary Report');
  console.log('='.repeat(70));
  console.log(` Total Packages:      ${batchReport.totalPackages}`);
  console.log(` Ingested / Verified: ${batchReport.ingestedPackages}`);
  console.log(` Total Rules:         ${batchReport.totalRules}`);
  console.log(` Total Versions:      ${batchReport.totalVersions}`);
  console.log(` Execution Time:      ${elapsed}s`);
  console.log('-'.repeat(70));

  for (const res of batchReport.results) {
    const icon = res.success ? '✅' : '❌';
    console.log(` ${icon} [${res.packageCode}] ${res.rulesIngested} rules, ${res.versionsCreated} versions (Tests: ${res.testCasesEvaluated ?? 0})`);
    if (res.error) {
      console.log(`    Error: ${res.error}`);
    }
  }
  console.log('='.repeat(70) + '\n');

  if (!batchReport.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nFatal error executing package sync CLI:', err);
  process.exit(1);
});
