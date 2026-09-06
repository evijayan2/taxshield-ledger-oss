import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var globalServerPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.globalServerPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.globalServerPrisma = prisma;
}
