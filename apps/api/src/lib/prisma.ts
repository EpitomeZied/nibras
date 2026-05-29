import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { nibrasApiPrisma?: PrismaClient };

/** One Prisma client for the API process — avoids duplicate pools to the DB. */
export function getSharedPrisma(): PrismaClient {
  if (!globalForPrisma.nibrasApiPrisma) {
    globalForPrisma.nibrasApiPrisma = new PrismaClient();
  }
  return globalForPrisma.nibrasApiPrisma;
}

export async function disconnectSharedPrisma(): Promise<void> {
  if (globalForPrisma.nibrasApiPrisma) {
    await globalForPrisma.nibrasApiPrisma.$disconnect();
    globalForPrisma.nibrasApiPrisma = undefined;
  }
}
