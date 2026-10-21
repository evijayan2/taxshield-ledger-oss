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

export function createServerApp(): express.Express {
  const app = express();

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

  // Receipt OCR Extraction Endpoint (Protected)
  // Extracts vendor, date, total, subtotal, tax, and suggested Schedule C category.
  // ALWAYS returns with status: 'unconfirmed' for mandatory user confirmation.
  app.post('/api/expenses/scan-receipt', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { rawText, base64Data, fileName, fileUrl } = req.body;
      if (!rawText && !base64Data && !fileUrl) {
        return res.status(400).json({
          success: false,
          error: 'Please provide rawText, base64Data, or a receipt file to scan.',
        });
      }

      const { processReceiptScan } = await import('taxshield-ledger-core');
      const scanResult = await processReceiptScan({
        rawText,
        base64Data,
        fileName,
        fileUrl,
      });

      return res.json({ success: true, result: scanResult });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Receipt scan failed.' });
    }
  });

  // Stripe Webhook Endpoint (Receives checkout.session.completed)
  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      const signature = (req.headers['stripe-signature'] as string) || '';
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
      const payloadString = JSON.stringify(req.body);

      const { verifyStripeSignature, processStripeCheckoutCompleted } = await import('taxshield-ledger-core');

      // Verify signature if secret configured
      if (webhookSecret && signature) {
        const isValid = verifyStripeSignature(payloadString, signature, webhookSecret);
        if (!isValid) {
          return res.status(400).json({ error: 'Invalid Stripe signature' });
        }
      }

      const event = req.body;
      if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
        const session = event.data?.object || event;
        const result = await processStripeCheckoutCompleted(event.id || `evt_${Date.now()}`, session);
        return res.json({ received: true, result });
      }

      return res.json({ received: true, message: `Ignored event type: ${event.type}` });
    } catch (err: any) {
      console.error('Error in Stripe webhook:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Stateful W-9 Token Store
  const w9Tokens = new Map<string, {
    tokenHash: string;
    companyId: string;
    employeeId: string;
    contractorName: string;
    companyName: string;
    expiresAt: string;
    used: boolean;
  }>();

  // POST /api/contractors/invite-w9 — Generate single-use secure invite link (Owner only)
  app.post('/api/contractors/invite-w9', requireAuth, requireOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const { employeeId, contractorName } = req.body;
      const companyId = req.membership?.companyId || 'comp_main';
      const companyName = req.body.companyName || 'My Company';

      const { generateW9TokenPair } = await import('taxshield-ledger-core');
      const { rawToken, tokenHash } = generateW9TokenPair();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      w9Tokens.set(tokenHash, {
        tokenHash,
        companyId,
        employeeId,
        contractorName: contractorName || 'Contractor',
        companyName,
        expiresAt,
        used: false,
      });

      const inviteUrl = `${req.protocol}://${req.get('host')}/onboard/w9?token=${rawToken}`;
      return res.json({
        success: true,
        tokenHash,
        rawToken,
        inviteUrl,
        expiresAt,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/onboard/w9/verify — Public token verification endpoint
  app.get('/api/onboard/w9/verify', async (req, res) => {
    try {
      const rawToken = req.query.token as string;
      if (!rawToken) {
        return res.status(400).json({ valid: false, error: 'Invite token is required' });
      }

      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const tokenRecord = w9Tokens.get(tokenHash);

      if (!tokenRecord) {
        return res.status(404).json({ valid: false, error: 'Invalid or unrecognized invitation token' });
      }

      if (tokenRecord.used) {
        return res.status(410).json({ valid: false, error: 'This Form W-9 invitation link has already been used and certified' });
      }

      if (new Date(tokenRecord.expiresAt) < new Date()) {
        return res.status(410).json({ valid: false, error: 'This Form W-9 invitation link has expired (7-day validity exceeded)' });
      }

      return res.json({
        valid: true,
        contractorName: tokenRecord.contractorName,
        companyName: tokenRecord.companyName,
        companyId: tokenRecord.companyId,
        employeeId: tokenRecord.employeeId,
      });
    } catch (err: any) {
      return res.status(500).json({ valid: false, error: err.message });
    }
  });

  // POST /api/onboard/w9/submit — Public Form W-9 certification submission
  app.post('/api/onboard/w9/submit', async (req, res) => {
    try {
      const {
        token,
        businessName,
        taxClassification,
        tinType,
        tin,
        address,
        city,
        state,
        zipCode,
        certifiedSignature,
      } = req.body;

      if (!token || !tin || !certifiedSignature || !address || !city || !state || !zipCode) {
        return res.status(400).json({ success: false, error: 'Missing required Form W-9 certification fields' });
      }

      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const tokenRecord = w9Tokens.get(tokenHash);

      if (!tokenRecord || tokenRecord.used) {
        return res.status(400).json({ success: false, error: 'Invite token is invalid or has already been used' });
      }

      const { certifyFormW9 } = await import('taxshield-ledger-core');
      const w9Record = await certifyFormW9({
        companyId: tokenRecord.companyId,
        employeeId: tokenRecord.employeeId,
        businessName,
        taxClassification,
        tinType,
        tin,
        address,
        city,
        state,
        zipCode,
        certifiedSignature,
        ipAddress: req.ip,
      });

      // Mark token as used
      tokenRecord.used = true;
      w9Tokens.set(tokenHash, tokenRecord);

      return res.json({ success: true, w9Record });
    } catch (err: any) {
      console.error('Error submitting Form W-9:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // Bank Statement Reconciliation Endpoints (Owner Only)
  // =========================================================================

  // In-memory reconciliation fallback stores
  const inMemoryBankBatches = new Map<string, any>();
  const inMemoryBankTransactions = new Map<string, any>();

  // POST /api/reconciliation/import — Ingest & reconcile bank statement CSV
  app.post('/api/reconciliation/import', requireAuth, requireOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const { csvContent, fileName, accountName } = req.body;
      const companyId = req.membership?.companyId || 'comp_main';
      const actorId = req.user?.id || req.user?.email || 'owner';

      if (!csvContent) {
        return res.status(400).json({ success: false, error: 'Missing CSV content' });
      }

      const { parseBankCsv, reconcileBankBatch } = await import('taxshield-ledger-core');
      const parseResult = parseBankCsv(csvContent, companyId);
      if (!parseResult.success) {
        return res.status(400).json({ success: false, error: parseResult.warnings[0] || 'Failed to parse CSV' });
      }

      const { prisma } = await import('./server/prisma.js');
      let ledgerData = {
        generalExpenses: [] as any[],
        travelExpenses: [] as any[],
        invoices: [] as any[],
        payrollRuns: [] as any[],
        contractorPayments: [] as any[],
      };
      const existingFingerprints = new Set<string>();

      if (prisma) {
        try {
          const [expenses, trv, invs, runs, cp, existingTxs] = await Promise.all([
            prisma.generalExpense.findMany({ where: { companyId } }),
            prisma.travelExpense.findMany({ where: { companyId } }),
            prisma.invoice.findMany({ where: { companyId } }),
            prisma.payrollRun.findMany({ where: { companyId } }),
            prisma.contractorPayment.findMany({ where: { companyId } }),
            prisma.bankTransaction.findMany({ where: { companyId }, select: { fingerprint: true } }),
          ]);
          ledgerData = {
            generalExpenses: expenses,
            travelExpenses: trv,
            invoices: invs,
            payrollRuns: runs,
            contractorPayments: cp,
          };
          for (const t of existingTxs) {
            existingFingerprints.add(t.fingerprint);
          }
        } catch (dbErr) {
          console.warn('[Reconciliation] Fallback to in-memory database queries:', dbErr);
        }
      }

      const batchId = crypto.randomUUID();
      const reconResult = reconcileBankBatch(
        parseResult.rows,
        companyId,
        batchId,
        ledgerData,
        existingFingerprints
      );

      const batchRecord = {
        id: batchId,
        companyId,
        fileName: fileName || 'bank_statement.csv',
        accountName: accountName || 'Operating Account',
        accountMask: parseResult.accountMask || null,
        totalRows: reconResult.summary.total,
        matchedCount: reconResult.summary.matched,
        reviewCount: reconResult.summary.needsReview,
        unmatchedCount: reconResult.summary.unmatched,
        duplicateCount: reconResult.summary.duplicate,
        netAmount: parseResult.netAmount,
        importedAt: new Date(),
      };

      if (prisma) {
        try {
          await prisma.$transaction(async (tx: any) => {
            await tx.bankImportBatch.create({ data: batchRecord });
            for (const r of reconResult.reconciledRows) {
              await tx.bankTransaction.create({
                data: {
                  id: r.transaction.id,
                  companyId,
                  batchId,
                  fingerprint: r.transaction.fingerprint,
                  postedDate: r.transaction.postedDate,
                  rawDescription: r.transaction.rawDescription,
                  cleanPayee: r.transaction.cleanPayee,
                  amount: r.transaction.amount,
                  transactionType: r.transaction.transactionType,
                  reconciliationStatus: r.reconciliationStatus,
                  matchedEntityType: r.matchedEntityType || null,
                  matchedEntityId: r.matchedEntityId || null,
                  confidenceScore: r.confidenceScore || null,
                  matchNotes: r.matchNotes || null,
                  reconciledAt: r.transaction.reconciledAt ? new Date(r.transaction.reconciledAt) : null,
                  reconciledBy: r.transaction.reconciledBy || null,
                },
              });
            }
            await tx.auditLogEntry.create({
              data: {
                companyId,
                entityType: 'BankImportBatch',
                entityId: batchId,
                action: 'IMPORT',
                actor: actorId,
                notes: `Imported bank statement "${batchRecord.fileName}" (${reconResult.summary.total} rows, ${reconResult.summary.matched} matched, ${reconResult.summary.needsReview} needs review)`,
              },
            });
          });
        } catch (dbSaveErr) {
          console.warn('[Reconciliation] Could not persist batch to PostgreSQL, using memory store:', dbSaveErr);
        }
      }

      inMemoryBankBatches.set(batchId, batchRecord);
      for (const r of reconResult.reconciledRows) {
        inMemoryBankTransactions.set(r.transaction.id, r.transaction);
      }

      return res.json({
        success: true,
        batch: batchRecord,
        transactions: reconResult.reconciledRows.map((r) => r.transaction),
        summary: reconResult.summary,
      });
    } catch (err: any) {
      console.error('Error importing bank CSV:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/reconciliation/confirm-match — Confirm candidate match
  app.post('/api/reconciliation/confirm-match', requireAuth, requireOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const { bankTxId, entityType, entityId, notes } = req.body;
      const companyId = req.membership?.companyId || 'comp_main';
      const actorId = req.user?.id || req.user?.email || 'owner';

      const { prisma } = await import('./server/prisma.js');
      if (prisma) {
        try {
          await prisma.$transaction(async (tx: any) => {
            await tx.bankTransaction.update({
              where: { id: bankTxId },
              data: {
                reconciliationStatus: 'MATCHED',
                matchedEntityType: entityType,
                matchedEntityId: entityId,
                matchNotes: notes || 'Confirmed by owner',
                reconciledAt: new Date(),
                reconciledBy: actorId,
              },
            });
            await tx.auditLogEntry.create({
              data: {
                companyId,
                entityType: 'BankTransaction',
                entityId: bankTxId,
                action: 'RECONCILE_MATCH',
                actor: actorId,
                notes: `Reconciled bank transaction ${bankTxId} with ${entityType} ${entityId}`,
              },
            });
          });
        } catch (dbErr) {
          console.warn('[Reconciliation] PostgreSQL update failed, updating memory store:', dbErr);
        }
      }

      const existing = inMemoryBankTransactions.get(bankTxId);
      if (existing) {
        existing.reconciliationStatus = 'MATCHED';
        existing.matchedEntityType = entityType;
        existing.matchedEntityId = entityId;
        existing.matchNotes = notes || 'Confirmed by owner';
        existing.reconciledAt = new Date().toISOString();
        existing.reconciledBy = actorId;
        inMemoryBankTransactions.set(bankTxId, existing);
      }

      return res.json({ success: true, bankTxId });
    } catch (err: any) {
      console.error('Error confirming match:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/reconciliation/convert-expense — Convert unmatched bank transaction into a verified GeneralExpense
  app.post('/api/reconciliation/convert-expense', requireAuth, requireOwner, async (req: AuthenticatedRequest, res) => {
    try {
      const { bankTxId, expenseData } = req.body;
      const companyId = req.membership?.companyId || 'comp_main';
      const actorId = req.user?.id || req.user?.email || 'owner';

      const { prisma } = await import('./server/prisma.js');
      const newExpenseId = crypto.randomUUID();

      if (prisma) {
        try {
          await prisma.$transaction(async (tx: any) => {
            const bankTx = await tx.bankTransaction.findUnique({ where: { id: bankTxId } });
            if (!bankTx) throw new Error(`Bank transaction not found: ${bankTxId}`);

            await tx.generalExpense.create({
              data: {
                id: newExpenseId,
                companyId,
                expenseDate: bankTx.postedDate,
                category: expenseData.category || 'OTHER',
                payee: bankTx.cleanPayee,
                description: expenseData.description || bankTx.rawDescription,
                amount: bankTx.amount,
                scheduleCLine: expenseData.scheduleCLine || '27a',
                isTaxDeductible: expenseData.isTaxDeductible !== false,
                notes: `Reconciled from bank transaction: ${bankTx.rawDescription}`,
              },
            });

            await tx.bankTransaction.update({
              where: { id: bankTxId },
              data: {
                reconciliationStatus: 'MATCHED',
                matchedEntityType: 'GENERAL_EXPENSE',
                matchedEntityId: newExpenseId,
                matchNotes: `Converted to expense on Schedule C Line ${expenseData.scheduleCLine || '27a'}`,
                reconciledAt: new Date(),
                reconciledBy: actorId,
              },
            });

            await tx.auditLogEntry.create({
              data: {
                companyId,
                entityType: 'GeneralExpense',
                entityId: newExpenseId,
                action: 'CREATE_FROM_BANK_TX',
                actor: actorId,
                notes: `Created expense for $${bankTx.amount.toFixed(2)} (${bankTx.cleanPayee}) reconciled from bank statement`,
              },
            });
          });
        } catch (dbErr) {
          console.warn('[Reconciliation] PostgreSQL convert failed, falling back:', dbErr);
        }
      }

      return res.json({ success: true, expenseId: newExpenseId, bankTxId });
    } catch (err: any) {
      console.error('Error converting expense:', err);
      return res.status(500).json({ success: false, error: err.message });
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
      const serverUrl = (req.query.serverUrl as string) || process.env.TAXPACK_SERVER_URL || process.env.TAX_PACKAGE_SERVER_URL || undefined;
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
      const defaultTaxPackUrl = process.env.TAXPACK_SERVER_URL || process.env.TAX_PACKAGE_SERVER_URL || 'http://localhost:3333';

      const result = await syncAllAvailablePackages(serverUrl || defaultTaxPackUrl, {
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

      const defaultTaxPackUrl = process.env.TAXPACK_SERVER_URL || process.env.TAX_PACKAGE_SERVER_URL || 'http://localhost:3333';
      const { fetchAndVerifyPackage, ingestPackageIntoLedger } = await import('./server/services/taxPackageClient.js');
      const fetchResult = await fetchAndVerifyPackage(serverUrl || defaultTaxPackUrl, fileName);
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

  return app;
}

async function startServer() {
  const PORT = Number(process.env.PORT || 3000);
  const app = createServerApp();

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

const isServerlessRuntime = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.SERVERLESS);

if (!isServerlessRuntime && process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Fatal server startup error:', err);
  });
}

export default createServerApp;

