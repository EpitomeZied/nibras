'use strict';
// Stanford CS Curriculum v2 — Years 1–4 via shared seed modules
// Run: node scripts/seed-stanford-v2.js  OR  npm run seed:year1 … seed:year4

const { register } = require('tsx/cjs/api');
register();

const { PrismaClient } = require('@prisma/client');
const { seedYear1Curriculum } = require('../apps/api/src/lib/year1-seed.ts');
const { seedYear2Curriculum } = require('../apps/api/src/lib/year2-seed.ts');
const { seedYear3Curriculum } = require('../apps/api/src/lib/year3-seed.ts');
const { seedYear4Curriculum } = require('../apps/api/src/lib/year4-seed.ts');
const prisma = new PrismaClient();

const INSTRUCTOR_ID = process.env.NIBRAS_INSTRUCTOR_USER_ID || 'cmnmguy3l0000u5hpqtm9ebci';

const OLD_COURSE_SLUGS = ['stanford-cs-y1', 'stanford-cs-y2', 'stanford-cs-y3', 'stanford-cs-y4'];

async function removeOldYearCourses() {
  console.log('\n🗑   Removing old year-level courses…\n');
  for (const slug of OLD_COURSE_SLUGS) {
    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) {
      console.log(`  ↩  ${slug} — not found, skipping`);
      continue;
    }

    const projects = await prisma.project.findMany({ where: { courseId: course.id } });
    for (const p of projects) {
      await prisma.milestone.deleteMany({ where: { projectId: p.id } });
      await prisma.project.delete({ where: { id: p.id } });
    }

    await prisma.courseMembership.deleteMany({ where: { courseId: course.id } });
    await prisma.course.delete({ where: { id: course.id } });
    console.log(`  ✓  Deleted: ${slug}`);
  }
  console.log('');
}

async function seed() {
  await removeOldYearCourses();

  const opts = {
    log: (msg) => console.log(msg),
    instructorUserId: INSTRUCTOR_ID,
  };

  await seedYear1Curriculum(prisma, opts);
  console.log('');
  await seedYear2Curriculum(prisma, opts);
  console.log('');
  await seedYear3Curriculum(prisma, opts);
  console.log('');
  await seedYear4Curriculum(prisma, opts);

  console.log('\n─'.repeat(60));
  console.log('✅  Done! Stanford CS curriculum (Years 1–4) seeded.\n');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
