import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@/config/env';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Singleton Prisma client (Prisma 7 — the client is constructed with a driver
 * adapter; the connection URL no longer lives in the schema).
 * Imported by every feature service.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});
