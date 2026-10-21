import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';

let createServerApp: () => any;
try {
  const require = createRequire(import.meta.url);
  createServerApp = require('../dist/server.cjs').createServerApp;
} catch {
  const serverModule = await import('../server.js');
  createServerApp = serverModule.createServerApp;
}

const app = createServerApp();

/**
 * Vercel Serverless Function entrypoint for TaxShield Ledger OSS backend API.
 * Delegates incoming HTTP requests to the Express application router.
 */
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
