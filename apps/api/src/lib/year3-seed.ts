/**
 * Year 3 Junior — upserts tracking courses.
 */
import type { PrismaClient } from '@prisma/client';
import { YEAR3_COURSES } from './year3-curriculum';
import { seedYear1Course, type Year1SeedOptions } from './year1-seed';

/** Seed all six Year 3 tracking courses (four Stanford + CS 301 + CS 302). */
export async function seedYear3Curriculum(
  prisma: PrismaClient,
  options?: Year1SeedOptions
): Promise<void> {
  const log = options?.log ?? (() => {});
  log('🎓 Seeding Year 3 Junior (6 courses)…\n');

  for (const def of YEAR3_COURSES) {
    await seedYear1Course(prisma, def, options);
    log('');
  }

  log('✅ Year 3 curriculum seed complete.');
}
