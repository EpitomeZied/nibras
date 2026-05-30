import * as Sentry from '@sentry/node';
import { buildApp } from './app';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
  });
}

/**
 * Validate that all required environment variables are present
 * before the server starts. Exits with a clear error in production.
 */
function validateEnv(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  const required = ['DATABASE_URL', 'NIBRAS_ENCRYPTION_KEY'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `[nibras-api] Missing required environment variables: ${missing.join(', ')}. ` +
        'Set them before starting the server.'
    );
    process.exit(1);
  }
}

async function syncBadgeCatalogOnStartup(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  const { BADGE_CATALOG } = await import('./features/gamification/badges-catalog');
  const { GamificationService } = await import('./features/gamification/service');
  const { getSharedPrisma } = await import('./lib/prisma');
  try {
    const gamification = new GamificationService(getSharedPrisma());
    const count = await gamification.ensureBadgeCatalog();
    console.log(
      JSON.stringify({
        level: count >= BADGE_CATALOG.length ? 'info' : 'warn',
        msg: 'Badge catalog synced on startup',
        count,
        expected: BADGE_CATALOG.length,
      })
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'error',
        msg: 'Badge catalog sync failed on startup',
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }
}

async function syncCurriculumOnStartup(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  const { seedYear1Curriculum } = await import('./lib/year1-seed');
  const { seedYear2Curriculum } = await import('./lib/year2-seed');
  const { seedYear3Curriculum } = await import('./lib/year3-seed');
  const { seedYear4Curriculum } = await import('./lib/year4-seed');
  const { getSharedPrisma } = await import('./lib/prisma');
  try {
    const prisma = getSharedPrisma();
    await seedYear1Curriculum(prisma);
    await seedYear2Curriculum(prisma);
    await seedYear3Curriculum(prisma);
    await seedYear4Curriculum(prisma);
    console.log(
      JSON.stringify({
        level: 'info',
        msg: 'Years 1–4 curricula synced on startup',
      })
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'error',
        msg: 'Years 1–4 curriculum sync failed on startup',
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }
}

async function main(): Promise<void> {
  validateEnv();
  await syncBadgeCatalogOnStartup();
  await syncCurriculumOnStartup();
  const port = Number(process.env.PORT || '4848');
  const host = process.env.HOST || '127.0.0.1';
  const app = buildApp();
  await app.listen({ port, host });

  console.log(JSON.stringify({ level: 'info', msg: 'Nibras API started', host, port }));

  const shutdown = async (signal: string) => {
    console.log(JSON.stringify({ level: 'info', msg: `${signal} received, shutting down` }));
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exitCode = 1;
});
