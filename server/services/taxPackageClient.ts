/**
 * Tax Package Client & Ingestion Service for TaxShield Ledger OSS.
 * Delegates core ingestion, cryptographic verification, and batch scheduling to shared core.
 */

export {
  computeSha256,
  computeVersionChecksum,
  computePackageChecksum,
  verifyPackageChecksum,
  evaluatePackageTestCases,
  fetchRemotePackageCatalog,
  fetchAndVerifyPackage,
  ingestPackageIntoLedger,
  syncAllAvailablePackages,
  startDailyPackageSyncScheduler,
  stopDailyPackageSyncScheduler,
  getDailyPackageSyncStatus,
  triggerManualPackageSync,
  type IRemotePackageCatalogItem,
  type IIngestionResult,
  type IBatchIngestionResult,
  type IIngestionOptions,
  type ISchedulerStatus,
} from 'taxshield-ledger-core/server';
