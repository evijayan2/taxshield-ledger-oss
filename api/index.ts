import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createServerApp } = require('../dist/server.cjs');

const app = createServerApp();

/**
 * Vercel Serverless Function entrypoint for TaxShield Ledger OSS backend API.
 * Delegates incoming HTTP requests to the Express application router.
 */
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
