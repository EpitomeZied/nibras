/**
 * Year 2 Shared CS Core seed — upserts sophomore tracking courses.
 */
import type { PrismaClient } from '@prisma/client';
import { YEAR2_COURSES } from './year2-curriculum';
import { seedYear1Course, type Year1SeedOptions } from './year1-seed';

/** Seed all eight Year 2 tracking courses (six core + CS 109 + CS 143). */
export async function seedYear2Curriculum(
  prisma: PrismaClient,
  options?: Year1SeedOptions
): Promise<void> {
  const log = options?.log ?? (() => {});
  log('🎓 Seeding Year 2 Shared CS Core (8 courses)…\n');

  for (const def of YEAR2_COURSES) {
    await seedYear1Course(prisma, def, options);
    log('');
  }

  log('✅ Year 2 curriculum seed complete.');
}
