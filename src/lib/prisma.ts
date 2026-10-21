import { PrismaClient } from '@prisma/client';
import { logError, logInfo } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

/**
 * Singleton instance of PrismaClient to prevent connection exhaustion in dev.
 */
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.LOCAL_POSTGRES_URL;

if (databaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

export const prisma: PrismaClient =
  globalThis.globalPrisma ||
  new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalPrisma = prisma;
}

/**
 * Connect to PostgreSQL via Prisma Client.
 */
export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    logInfo('Successfully connected to PostgreSQL database via Prisma');
    return true;
  } catch (error) {
    logError('Failed to connect to database via Prisma', error);
    return false;
  }
}
