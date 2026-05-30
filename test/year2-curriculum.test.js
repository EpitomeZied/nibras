'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { YEAR2_COURSES, YEAR2_COURSE_SLUGS } = require('../apps/api/dist/lib/year2-curriculum');
const { seedYear2Curriculum } = require('../apps/api/dist/lib/year2-seed');

test('YEAR2_COURSES defines eight sophomore courses', () => {
  assert.equal(YEAR2_COURSES.length, 8);
  assert.deepEqual(YEAR2_COURSE_SLUGS, [
    'stanford-cs107',
    'stanford-cs109',
    'stanford-cs161',
    'year2-cs203',
    'stanford-cs110',
    'year2-cs205',
    'year2-cs206',
    'stanford-cs143',
  ]);
  for (const def of YEAR2_COURSES) {
    assert.ok(def.termLabel.startsWith('Year 2'), `${def.slug} must be Year 2`);
    assert.equal(def.project.level, 2, `${def.slug} project level`);
    assert.ok(def.sections.length >= 1, `${def.slug} needs sections`);
    assert.ok(def.assignments.length >= 1, `${def.slug} needs assignments`);
    assert.ok(def.project.milestones.length >= 1, `${def.slug} needs milestones`);
  }
});

test('seedYear2Curriculum upserts eight Year 2 courses in database', async (t) => {
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

  await seedYear2Curriculum(prisma);

  const year2Courses = await prisma.course.findMany({
    where: { isActive: true, termLabel: { startsWith: 'Year 2' } },
    orderBy: { slug: 'asc' },
  });
  assert.equal(year2Courses.length, 8);

  for (const course of year2Courses) {
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
