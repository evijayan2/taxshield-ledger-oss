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
});
