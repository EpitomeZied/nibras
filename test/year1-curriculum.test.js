'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { YEAR1_COURSES, YEAR1_COURSE_SLUGS } = require('../apps/api/dist/lib/year1-curriculum');
const { seedYear1Curriculum } = require('../apps/api/dist/lib/year1-seed');

test('YEAR1_COURSES defines seven foundation courses', () => {
  assert.equal(YEAR1_COURSES.length, 7);
  assert.deepEqual(YEAR1_COURSE_SLUGS, [
    'stanford-cs106a',
    'year1-math111',
    'year1-eng101',
    'stanford-cs106b',
    'stanford-cs103',
    'year1-math112',
    'year1-phy101',
  ]);
  for (const def of YEAR1_COURSES) {
    assert.ok(def.termLabel.startsWith('Year 1'), `${def.slug} must be Year 1`);
    assert.ok(def.sections.length >= 1, `${def.slug} needs sections`);
    assert.ok(def.assignments.length >= 1, `${def.slug} needs assignments`);
    assert.ok(def.project.milestones.length >= 1, `${def.slug} needs milestones`);
  }
});

test('year1-eng101 includes 25 Stanford Writing in the Sciences lectures', () => {
  const eng101 = YEAR1_COURSES.find((c) => c.slug === 'year1-eng101');
  assert.ok(eng101);
  assert.equal(eng101.lectures?.length, 25);
  assert.equal(eng101.sequentialVideos, true);
});

test('seedYear1Curriculum upserts seven Year 1 courses in database', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL not set');
    return;
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  t.after(async () => prisma.$disconnect());

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    t.skip('Database not reachable');
    return;
  }

  await seedYear1Curriculum(prisma);

  const year1Courses = await prisma.course.findMany({
    where: { isActive: true, termLabel: { startsWith: 'Year 1' } },
    orderBy: { slug: 'asc' },
  });
  assert.equal(year1Courses.length, 7);

  const cs107InYear1 = await prisma.course.findFirst({
    where: { slug: 'stanford-cs107', termLabel: { startsWith: 'Year 1' } },
  });
  assert.equal(cs107InYear1, null);

  for (const course of year1Courses) {
    const sections = await prisma.courseSection.count({ where: { courseId: course.id } });
    const assignments = await prisma.courseAssignment.count({
      where: { courseId: course.id, published: true },
    });
    const project = await prisma.project.findFirst({
      where: { courseId: course.id, status: 'published' },
    });
    assert.ok(sections >= 1, `${course.slug} sections`);
    assert.ok(assignments >= 1, `${course.slug} assignments`);
    assert.ok(project, `${course.slug} project`);
    const milestones = await prisma.milestone.count({ where: { projectId: project.id } });
    assert.ok(milestones >= 1, `${course.slug} milestones`);
  }
});
