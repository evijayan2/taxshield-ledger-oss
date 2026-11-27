import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'node:http';
import express from 'express';

const mockTx = {
  taxFilingUploadTemplate: {
    upsert: vi.fn(),
    delete: vi.fn(),
  },
  auditLogEntry: {
    create: vi.fn(),
  },
};

vi.mock('../../server/prisma.js', () => ({
  prisma: {
    taxFilingUploadTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
    },
    payrollRun: {
      findFirst: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<any>) => cb(mockTx)),
  },
}));

vi.mock('../../server/auth/middleware.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-owner-1', email: 'owner@impactflow.test' };
    req.membership = { companyId: 'comp-1', role: 'OWNER' };
    next();
  },
  requireOwner: (_req: any, _res: any, next: any) => next(),
}));

import { prisma } from '../../server/prisma.js';
import { taxUploadTemplateRouter } from '../../server/routes/taxUploadTemplateRoutes.js';

async function requestRoute(method: string, path: string, body?: unknown) {
  const app = express();
  app.use(express.json());
  app.use('/api', taxUploadTemplateRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };

  try {
    const res = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    return { status: res.status, body: json };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe('taxUploadTemplateRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects cross-company access with 403', async () => {
    const res = await requestRoute('GET', '/api/companies/comp-other/upload-templates');
    expect(res.status).toBe(403);
  });

  it('requires a template file when enabling an upload option', async () => {
    const res = await requestRoute('PUT', '/api/companies/comp-1/upload-templates/PA_KEYSTONE_EIT', {
      portalLabel: 'PA Local EIT — Keystone Collections Group',
      jurisdiction: 'PA-LOCAL',
      isEnabled: true,
      templateFileName: '',
      templateContent: '',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('template file');
  });

  it('persists upload template and writes audit log entry', async () => {
    mockTx.taxFilingUploadTemplate.upsert.mockResolvedValue({
      id: 'tpl-1',
      companyId: 'comp-1',
      portalKey: 'PA_KEYSTONE_EIT',
      portalLabel: 'PA Local EIT — Keystone Collections Group',
      jurisdiction: 'PA-LOCAL',
      fileFormat: 'CSV',
      isEnabled: true,
      templateFileName: 'keystone-eit.csv',
      templateContent: 'TaxYear,Quarter,GrossWages,EITWithheld\n',
      templateHashSha256: 'hash123',
      detectedHeaders: ['TaxYear', 'Quarter', 'GrossWages', 'EITWithheld'],
      businessLocationPsd: '150302',
    });

    const res = await requestRoute('PUT', '/api/companies/comp-1/upload-templates/PA_KEYSTONE_EIT', {
      portalLabel: 'PA Local EIT — Keystone Collections Group',
      jurisdiction: 'PA-LOCAL',
      fileFormat: 'CSV',
      isEnabled: true,
      templateFileName: 'keystone-eit.csv',
      templateContent: 'TaxYear,Quarter,GrossWages,EITWithheld\n',
      businessLocationPsd: '150302',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.template.portalKey).toBe('PA_KEYSTONE_EIT');
    expect(mockTx.auditLogEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'comp-1',
          action: 'UPSERT_TAX_UPLOAD_TEMPLATE',
          actorId: 'user-owner-1',
        }),
      })
    );
  });

  it('lists configured templates and supported portals', async () => {
    (prisma.taxFilingUploadTemplate.findMany as any).mockResolvedValue([]);
    const res = await requestRoute('GET', '/api/companies/comp-1/upload-templates');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.supportedPortals)).toBe(true);
  });

  it('exports using request-body payrollRun fallback when DB run is not yet persisted', async () => {
    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'comp-1',
      name: 'ImpactFlow Labs LLC',
      stateTaxId: '20443336',
      ein: '42-4656601',
      address: '542 Prizer Ct',
      city: 'Downingtown',
      state: 'PA',
      zip: '19335',
    });
    (prisma.taxFilingUploadTemplate.findUnique as any).mockResolvedValue({
      id: 'tpl-1',
      companyId: 'comp-1',
      portalKey: 'PA_KEYSTONE_EIT',
      portalLabel: 'PA Local EIT — Keystone Collections Group',
      jurisdiction: 'PA-LOCAL',
      fileFormat: 'CSV',
      isEnabled: true,
      templateFileName: 'keystone.csv',
      templateContent: 'TaxYear,Quarter,GrossWages,EITWithheld\n',
      templateHashSha256: 'abc',
      detectedHeaders: ['TaxYear', 'Quarter', 'GrossWages', 'EITWithheld'],
      businessLocationPsd: '150302',
    });
    (prisma.payrollRun.findFirst as any).mockResolvedValue(null);
    (prisma.employee.findMany as any).mockResolvedValue([
      { id: 'emp-1', firstName: 'Jane', lastName: 'Doe', ssnLast4: '1234', residentPsdCode: '150302' },
    ]);

    const res = await requestRoute('POST', '/api/companies/comp-1/payroll-runs/run-local-1/upload-export/PA_KEYSTONE_EIT', {
      payrollRun: {
        id: 'run-local-1',
        periodStart: '2026-11-16',
        periodEnd: '2026-11-30',
        payDate: '2026-12-05',
      },
      payStubs: [
        { id: 'stub-1', payrollRunId: 'run-local-1', employeeId: 'emp-1', grossEarnings: 1500, localIncomeTax: 15 },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fileName).toBe('pa_keystone_eit-2026-q4.csv');
    expect(res.body.content).toContain('2026,4,1500.00,15.00');
  });

  it('decrypts ssnEncrypted and maps Prisma streetAddress and localTaxJurisdictionCode for Keystone E-record CSV', async () => {
    const { encryptTIN } = await import('taxshield-ledger-core');
    const encryptedSsn = encryptTIN('123-45-6789');

    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'comp-1',
      name: 'ImpactFlow Labs LLC',
      stateTaxId: '00000000',
      ein: '42-4656601',
      address: '542 Prizer Ct',
      city: 'Downingtown',
      state: 'PA',
      zip: '19335',
    });
    (prisma.taxFilingUploadTemplate.findUnique as any).mockResolvedValue({
      id: 'tpl-1',
      companyId: 'comp-1',
      portalKey: 'PA_KEYSTONE_EIT',
      portalLabel: 'PA Local EIT — Keystone Collections Group',
      jurisdiction: 'PA-LOCAL',
      fileFormat: 'CSV',
      isEnabled: true,
      templateFileName: 'keystone.csv',
      templateContent: 'E,2026,1,259638527,7001,SAMPLE CO,100 MAIN ST,IRWIN,PA,15642,02180\n',
      templateHashSha256: 'abc',
      detectedHeaders: ['E'],
      businessLocationPsd: '150302',
    });
    (prisma.payrollRun.findFirst as any).mockResolvedValue({
      id: 'run-1',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-15'),
      payDate: new Date('2026-10-20'),
      payStubs: [
        { id: 'stub-1', payrollRunId: 'run-1', employeeId: 'emp-1', grossEarnings: 800, localIncomeTax: 9 },
      ],
    });
    (prisma.employee.findMany as any).mockResolvedValue([
      {
        id: 'emp-1',
        firstName: 'Abirami',
        lastName: 'Natarajan',
        ssnLastFour: '6789',
        ssnEncrypted: encryptedSsn,
        streetAddress: '100 Oak Ln',
        city: 'Downingtown',
        state: 'PA',
        zip: '19335',
        localTaxJurisdictionCode: '150202',
        residenceHistory: [],
      },
    ]);

    const res = await requestRoute('POST', '/api/companies/comp-1/payroll-runs/run-1/upload-export/PA_KEYSTONE_EIT');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const lines = res.body.content.split('\r\n');
    expect(lines[1]).toBe('123456789,Natarajan Abirami,100 Oak Ln,Downingtown,PA,19335,2026,4,800.00,9.00,150202');
    expect(res.body.warnings).toEqual([]);
  });

  it('falls back to req.body.employees ssnEncrypted when DB employee row has null ssnEncrypted', async () => {
    const { encryptTIN } = await import('taxshield-ledger-core');
    const encryptedSsn = encryptTIN('987-65-4321');

    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'comp-1',
      name: 'ImpactFlow Labs LLC',
      stateTaxId: '00000000',
      ein: '42-4656601',
      address: '542 Prizer Ct',
      city: 'Downingtown',
      state: 'PA',
      zip: '19335',
    });
    (prisma.taxFilingUploadTemplate.findUnique as any).mockResolvedValue({
      id: 'tpl-2',
      companyId: 'comp-1',
      portalKey: 'PA_KEYSTONE_LST',
      portalLabel: 'PA Local LST — Keystone Collections Group',
      jurisdiction: 'PA-LOCAL',
      fileFormat: 'CSV',
      isEnabled: true,
      templateFileName: 'keystone-lst.csv',
      templateContent: 'L,2026,1,259638527,7001,SAMPLE CO,100 MAIN ST,IRWIN,PA,15642,02180\n',
      templateHashSha256: 'abc',
      detectedHeaders: ['L'],
      businessLocationPsd: '150302',
    });
    (prisma.payrollRun.findFirst as any).mockResolvedValue({
      id: 'run-1',
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-15'),
      payDate: new Date('2026-10-20'),
      payStubs: [
        { id: 'stub-1', payrollRunId: 'run-1', employeeId: 'emp-1', grossEarnings: 800, localFlatTax: 10 },
      ],
    });
    (prisma.employee.findMany as any).mockResolvedValue([
      {
        id: 'emp-1',
        firstName: 'Abirami',
        lastName: 'Natarajan',
        ssnLastFour: '4321',
        ssnEncrypted: null,
        streetAddress: '100 Oak Ln',
        city: 'Downingtown',
        state: 'PA',
        zip: '19335',
        localTaxJurisdictionCode: '150202',
        residenceHistory: [],
      },
    ]);

    const res = await requestRoute('POST', '/api/companies/comp-1/payroll-runs/run-1/upload-export/PA_KEYSTONE_LST', {
      employees: [{ id: 'emp-1', ssnEncrypted: encryptedSsn }],
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const lines = res.body.content.split('\r\n');
    expect(lines[0]).toBe(
      '424656601,2026,4,987654321,Natarajan,Abirami,,100 Oak Ln,,Downingtown,PA,19335,10.00,150302,800.00,,'
    );
    expect(res.body.warnings).toEqual([]);
  });
});
