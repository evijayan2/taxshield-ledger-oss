import { PrismaClient as RealPrismaClient } from '@prisma/client';
import { logError, logInfo } from './logger';
import { prisma as browserPrisma, PrismaClient as BrowserPrismaClient } from './prismaBrowserStub';

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: RealPrismaClient | undefined;
}

const isBrowser = typeof window !== 'undefined' || typeof process === 'undefined' || !process.env;

const databaseUrl = !isBrowser
  ? process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.LOCAL_POSTGRES_URL
  : undefined;

if (!isBrowser && databaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

/**
 * Singleton instance of PrismaClient.
 * In browser environments, returns the lightweight browser-safe stub.
 */
export const prisma: RealPrismaClient = (
  isBrowser
    ? browserPrisma
    : globalThis.globalPrisma ||
      new RealPrismaClient({
        ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
        log: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })
) as unknown as RealPrismaClient;

if (!isBrowser && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
  globalThis.globalPrisma = prisma;
}

export const PrismaClient = isBrowser ? BrowserPrismaClient : RealPrismaClient;

/**
 * Connect to PostgreSQL via Prisma Client.
 */
export async function connectDatabase(): Promise<boolean> {
  if (isBrowser) {
    return true;
  }
  try {
    await prisma.$connect();
    logInfo('Successfully connected to PostgreSQL database via Prisma');
    return true;
  } catch (error) {
    logError('Failed to connect to database via Prisma', error);
    return false;
  }
}
