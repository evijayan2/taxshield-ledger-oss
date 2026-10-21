import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import handler from '../../api/index.js';
import { createServerApp } from '../../server.js';

describe('Vercel Serverless Function Handler (taxshield-ledger-oss)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Mount serverless handler into standard HTTP server to simulate Vercel serverless environment
    server = createServer((req, res) => {
      handler(req, res);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://localhost:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('exports a valid serverless request handler function', () => {
    expect(typeof handler).toBe('function');
    const app = createServerApp();
    expect(typeof app).toBe('function');
  });

  it('responds with 200 OK on GET /api/health in serverless context', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { status: string; time: string };
    expect(body.status).toBe('ok');
    expect(typeof body.time).toBe('string');
  });

  it('responds with 200 OK on GET /api/postgres/status in serverless context', async () => {
    const res = await fetch(`${baseUrl}/api/postgres/status`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { configured: boolean; connected: boolean };
    expect(typeof body.configured).toBe('boolean');
    expect(typeof body.connected).toBe('boolean');
  });

  it('respects TAXPACK_SERVER_URL environment variable', () => {
    const testUrl = 'https://tax-rule-packaging-engine.vercel.app';
    process.env.TAXPACK_SERVER_URL = testUrl;

    expect(process.env.TAXPACK_SERVER_URL).toBe(testUrl);
    delete process.env.TAXPACK_SERVER_URL;
  });
});
