import { PrismaClient } from '@prisma/client';
import { resolvePostgresUrl } from './db.js';

declare global {
  // eslint-disable-next-line no-var
  var globalServerPrisma: PrismaClient | undefined;
}

const databaseUrl = resolvePostgresUrl(true);

if (databaseUrl && (!process.env.DATABASE_URL || process.env.VERCEL_ENV === 'preview')) {
  process.env.DATABASE_URL = databaseUrl;
}

export const prisma: PrismaClient =
  globalThis.globalServerPrisma ||
  new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalServerPrisma = prisma;
}
