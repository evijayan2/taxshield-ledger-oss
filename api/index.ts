import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServerApp } from '../server.js';

const app = createServerApp();

/**
 * Vercel Serverless Function entrypoint for TaxShield Ledger OSS backend API.
 * Delegates incoming HTTP requests to the Express application router.
 */
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  app(req, res);
}
