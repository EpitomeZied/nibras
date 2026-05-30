/**
 * Year 4 Senior — upserts tracking courses.
 */
import type { PrismaClient } from '@prisma/client';
import { YEAR4_COURSES } from './year4-curriculum';
import { seedYear1Course, type Year1SeedOptions } from './year1-seed';

/** Seed all four Year 4 tracking courses (three Stanford + CS 303 capstone). */
export async function seedYear4Curriculum(
  prisma: PrismaClient,
  options?: Year1SeedOptions
): Promise<void> {
  const log = options?.log ?? (() => {});
  log('🎓 Seeding Year 4 Senior (4 courses)…\n');

  for (const def of YEAR4_COURSES) {
    await seedYear1Course(prisma, def, options);
    log('');
  }

  log('✅ Year 4 curriculum seed complete.');
}
