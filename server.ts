import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getPool, initPostgresTables, getPostgresConnectionString } from './server/db.js';
import { loadAllDataFromPostgres, saveAllDataToPostgres } from './server/dataService.js';
import { authRouter } from './server/auth/routes.js';
import { requireAuth, requireOwner, type AuthenticatedRequest } from './server/auth/middleware.js';

const getCurrentDirname = () => {
  if (typeof __dirname !== 'undefined' && __dirname) return __dirname;
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
};
const currentDir = getCurrentDirname();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // Authentication Endpoints
  app.use('/api/auth', authRouter);

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Check PostgreSQL / Vercel Postgres Connection Status
  app.get('/api/postgres/status', async (req, res) => {
    const connStr = getPostgresConnectionString();
    if (!connStr) {
      return res.json({
        configured: false,
        connected: false,
        message: 'No POSTGRES_URL or DATABASE_URL environment variable found. App is using persistent browser storage fallback with instant export/import.',
        help: 'To connect Vercel Postgres, add POSTGRES_URL to your environment variables or Vercel project settings.'
      });
    }

    try {
      const initResult = await initPostgresTables();
      
      // Parse safe host and database name without exposing credentials
      let safeHost = 'configured';
      let safeDb = 'postgres';
      try {
        const parsed = new URL(connStr);
        safeHost = parsed.hostname;
        safeDb = parsed.pathname.replace('/', '') || 'postgres';
      } catch {
        // ignore parse error
      }

      const isLocalHost = safeHost === 'localhost' || safeHost === '127.0.0.1';
      const provider = isLocalHost
        ? 'Local PostgreSQL'
        : (safeHost.includes('vercel') ? 'Vercel Postgres' : (safeHost.includes('neon') ? 'Neon Postgres' : 'PostgreSQL Database'));

      return res.json({
        configured: true,
        connected: initResult.success,
        message: initResult.message,
        tableCounts: initResult.tableCounts,
        host: safeHost,
        database: safeDb,
        provider,
        isLocal: isLocalHost
      });
    } catch (err: any) {
      return res.json({
        configured: true,
        connected: false,
        message: `Database connection error: ${err.message}`,
        error: err.message
      });
    }
  });

  // Initialize / Migrate Postgres Tables (Protected)
  app.post('/api/postgres/init', requireAuth, requireOwner, async (req, res) => {
    try {
      const result = await initPostgresTables();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Load All Ledger Data from Postgres (Protected)
  app.get('/api/data', requireAuth, async (req, res) => {
    const connStr = getPostgresConnectionString();
    if (!connStr) {
      return res.status(503).json({ source: 'error', error: 'PostgreSQL connection is not configured in environment variables (POSTGRES_URL / DATABASE_URL).', data: null });
    }

    try {
      const initResult = await initPostgresTables();
      if (!initResult.success) {
        return res.status(503).json({ source: 'error', error: `PostgreSQL connection failed: ${initResult.message}`, data: null });
      }
      const data = await loadAllDataFromPostgres();
      return res.json({ source: 'postgres', data });
    } catch (err: any) {
      console.error('Error in GET /api/data:', err);
      return res.status(503).json({ source: 'error', error: err.message, data: null });
    }
  });

  // Save All Ledger Data to Postgres (Protected)
  app.post('/api/data', requireAuth, async (req, res) => {
    const connStr = getPostgresConnectionString();
    if (!connStr) {
      return res.status(503).json({ success: false, error: 'PostgreSQL connection is not configured in environment variables.' });
    }

    try {
      const initResult = await initPostgresTables();
      if (!initResult.success) {
        return res.status(503).json({ success: false, error: `PostgreSQL connection failed: ${initResult.message}` });
      }
      const result = await saveAllDataToPostgres(req.body);
      return res.json(result);
    } catch (err: any) {
      console.error('Error in POST /api/data:', err);
      return res.status(503).json({ success: false, error: err.message });
    }
  });

  // Mercury Bank API Integration Routes (Owner Only)
  app.post('/api/mercury/test-connection', requireAuth, requireOwner, async (req, res) => {
    try {
      const { apiKey, environment } = req.body;
      const { fetchMercuryAccounts } = await import('./server/services/mercuryService.js');
      const accounts = await fetchMercuryAccounts(apiKey, environment || 'SANDBOX');
      return res.json({ success: true, accounts });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/mercury/disburse-tax', requireAuth, requireOwner, async (req, res) => {
    try {
      const { apiKey, environment, accountId, task, company } = req.body;

      if (task && (task.status === 'FILED' || task.confirmationNumber)) {
        return res.status(400).json({
          success: false,
          error: `Tax return (${task.formIdentifier || task.title}) has already been marked as paid and filed with confirmation ref ${task.confirmationNumber || 'LOGGED'}. Duplicate ACH disbursements are blocked.`
        });
      }

      const { disburseMercuryTaxPayment } = await import('./server/services/mercuryService.js');
      const { buildFederal941TXP, buildPaStateSitTXP } = await import('./server/services/txpGenerator.js');

      let txpAddenda = '';
      if (task.jurisdiction === 'FEDERAL_IRS') {
        txpAddenda = buildFederal941TXP(company.ein || '000000000', task.dueDate, task.amountDue);
      } else if (task.jurisdiction === 'PA_MYPATH_SIT') {
        txpAddenda = buildPaStateSitTXP(company.stateTaxId || '00000000', task.dueDate, task.amountDue);
      }

      const result = await disburseMercuryTaxPayment(apiKey, environment || 'SANDBOX', {
        accountId,
        amount: task.amountDue,
        paymentMethod: 'ach',
        recipientName: task.jurisdiction === 'FEDERAL_IRS' ? 'IRS EFTPS Payroll Tax' : 'PA Dept of Revenue Withholding',
        paymentReference: task.title || 'Tax Remittance',
        txpAddenda,
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  // Tax Package Distribution Server Sync Routes (Owner Only)
  app.get('/api/tax-packages/status', requireAuth, requireOwner, async (_req, res) => {
    try {
      const { getDailyPackageSyncStatus } = await import('./server/services/taxPackageClient.js');
      return res.json({ success: true, status: getDailyPackageSyncStatus() });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/tax-packages/remote', requireAuth, requireOwner, async (req, res) => {
    try {
      const serverUrl = (req.query.serverUrl as string) || undefined;
      const { fetchRemotePackageCatalog } = await import('./server/services/taxPackageClient.js');
      const result = await fetchRemotePackageCatalog(serverUrl);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, packages: [], error: err.message });
    }
  });

  app.post('/api/tax-packages/sync-all', requireAuth, requireOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const { serverUrl, activateImmediately, confirmWrite } = req.body;
      if (!confirmWrite) {
        return res.status(400).json({
          success: false,
          error: 'Explicit user confirmation required (confirmWrite: true) before writing to the database.'
        });
      }

      const { syncAllAvailablePackages } = await import('./server/services/taxPackageClient.js');
      const actorId = req.user?.id || 'sys_owner';
      const companyId = req.membership?.companyId || undefined;

      const result = await syncAllAvailablePackages(serverUrl || 'http://localhost:3333', {
        companyId,
        actorId,
        activateImmediately: activateImmediately !== undefined ? Boolean(activateImmediately) : true
      });

      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/tax-packages/ingest', requireAuth, requireOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const { serverUrl, fileName, activateImmediately, confirmWrite } = req.body;
      if (!confirmWrite) {
        return res.status(400).json({
          success: false,
          error: 'Explicit user confirmation required (confirmWrite: true) before writing to the database.'
        });
      }
      if (!fileName) {
        return res.status(400).json({ success: false, error: 'Package file name is required.' });
      }

      const { fetchAndVerifyPackage, ingestPackageIntoLedger } = await import('./server/services/taxPackageClient.js');
      const fetchResult = await fetchAndVerifyPackage(serverUrl || 'http://localhost:3333', fileName);
      if (!fetchResult.success || !fetchResult.package) {
        return res.status(400).json({ success: false, error: fetchResult.error });
      }

      const actorId = req.user?.id || 'sys_owner';
      const companyId = req.membership?.companyId || undefined;

      const ingestResult = await ingestPackageIntoLedger(fetchResult.package, {
        companyId,
        actorId,
        activateImmediately: Boolean(activateImmediately)
      });

      return res.json(ingestResult);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/tax-rules — Returns all tax rules ingested from TaxPack server
  app.get('/api/tax-rules', async (_req, res) => {
    try {
      const { prisma } = await import('./server/prisma.js');
      const rules = await prisma.taxRule.findMany({
        include: {
          jurisdiction: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
      });

      const items = rules.map((r) => {
        const activeVer = r.versions.find((v) => v.status === 'ACTIVE') || r.versions[0];
        let ruleDataObj: any = null;
        if (activeVer?.ruleData) {
          try {
            ruleDataObj = typeof activeVer.ruleData === 'string' ? JSON.parse(activeVer.ruleData) : activeVer.ruleData;
          } catch {
            ruleDataObj = null;
          }
        }

        let summaryText = r.description || '';
        if (ruleDataObj) {
          if (Array.isArray(ruleDataObj.brackets) && ruleDataObj.brackets.length > 0) {
            const rates = ruleDataObj.brackets.map((b: any) => b.marginalRate * 100);
            const minRate = Math.min(...rates);
            const maxRate = Math.max(...rates);
            summaryText = `Graduated Brackets (${ruleDataObj.brackets.length} Tiers: ${minRate.toFixed(2)}% – ${maxRate.toFixed(2)}%)`;
          } else if (typeof ruleDataObj.rate === 'number') {
            const pct = (ruleDataObj.rate * 100).toFixed(2);
            summaryText = `Flat Rate: ${pct}%${ruleDataObj.wageCap ? ` • Wage Cap: $${ruleDataObj.wageCap.toLocaleString()}` : ''}`;
          }
        }

        return {
          id: activeVer?.id || r.id,
          ruleCode: r.ruleCode,
          name: r.name,
          jurisdiction: r.jurisdiction.code,
          category: r.category,
          versionNumber: activeVer?.versionNumber || 1,
          status: activeVer?.status || 'ACTIVE',
          sourceTitle: activeVer?.sourceTitle || '',
          sourceUrl: activeVer?.sourceUrl || '',
          sourcePublisher: activeVer?.sourcePublisher || '',
          statuteReference: activeVer?.statuteReference || '',
          citationTier: activeVer?.citationTier || 'TIER_1_OFFICIAL',
          effectiveStart: activeVer?.effectiveStart ? new Date(activeVer.effectiveStart).toISOString().split('T')[0] : '2026-01-01',
          ruleDataSummary: summaryText,
          ruleData: ruleDataObj,
        };
      });

      return res.json({ success: true, rules: items });
    } catch (err: any) {
      return res.status(500).json({ success: false, rules: [], error: err.message });
    }
  });

  // Mandatory Startup Check & Auto-Sync with TaxPack Distribution Server
  await verifyAndSyncTaxPackServer();

  // Setup Vite or Static File Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`TaxShield Ledger Server running on http://0.0.0.0:${PORT}`);
    try {
      const { startDailyPackageSyncScheduler } = await import('./server/services/taxPackageClient.js');
      startDailyPackageSyncScheduler({ serverUrl: process.env.TAXPACK_SERVER_URL || process.env.TAX_PACKAGE_SERVER_URL || 'http://localhost:3333' });
    } catch (schedErr) {
      console.warn('Could not start daily package sync scheduler:', schedErr);
    }
  });
}

async function verifyAndSyncTaxPackServer() {
  const serverUrl = process.env.TAXPACK_SERVER_URL || process.env.TAX_PACKAGE_SERVER_URL || 'http://localhost:3333';
  console.log(`[TAXPACK MANDATORY INIT] Connecting to TaxPack server at ${serverUrl}...`);
  try {
    const { fetchRemotePackageCatalog, syncAllAvailablePackages } = await import('./server/services/taxPackageClient.js');
    const catalogResult = await fetchRemotePackageCatalog(serverUrl);
    if (!catalogResult || !catalogResult.success) {
      console.error('\n' + '='.repeat(80));
      console.error(`❌ [FATAL ERROR] Mandatory TaxPack distribution server unreachable at ${serverUrl}`);
      console.error('   All tax rules in TaxShield Ledger must flow strictly from the TaxPack server.');
      console.error('   Built-in hardcoded rules have been removed. System startup aborted.');
      console.error('   Error details:', catalogResult?.error || 'Connection refused / server offline');
      console.error('=' .repeat(80) + '\n');
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
      return;
    }

    console.log(`✓ [TAXPACK] Connected to TaxPack server! Found ${catalogResult.packages.length} tax package(s). Ingesting...`);
    const syncResult = await syncAllAvailablePackages(serverUrl, {
      actorId: 'system_startup',
      activateImmediately: true,
    });
    console.log(`✓ [TAXPACK] Mandatory startup sync complete! Ingested ${syncResult.ingestedPackages} package(s), ${syncResult.totalRules} active rules.`);
  } catch (err: any) {
    console.error('\n' + '='.repeat(80));
    console.error(`❌ [FATAL ERROR] Mandatory TaxPack server initialization failed: ${err.message}`);
    console.error('=' .repeat(80) + '\n');
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
