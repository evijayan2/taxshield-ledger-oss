import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getPool, initPostgresTables, getPostgresConnectionString } from './server/db.js';
import { loadAllDataFromPostgres, saveAllDataToPostgres } from './server/dataService.js';

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
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

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

  // Initialize / Migrate Postgres Tables
  app.post('/api/postgres/init', async (req, res) => {
    try {
      const result = await initPostgresTables();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Load All Ledger Data from Postgres
  app.get('/api/data', async (req, res) => {
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

  // Save All Ledger Data to Postgres
  app.post('/api/data', async (req, res) => {
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

  // Mercury Bank API Integration Routes
  app.post('/api/mercury/test-connection', async (req, res) => {
    try {
      const { apiKey, environment } = req.body;
      const { fetchMercuryAccounts } = await import('./server/services/mercuryService.js');
      const accounts = await fetchMercuryAccounts(apiKey, environment || 'SANDBOX');
      return res.json({ success: true, accounts });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/mercury/disburse-tax', async (req, res) => {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaxShield Ledger Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
