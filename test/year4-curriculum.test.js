'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { YEAR4_COURSES, YEAR4_COURSE_SLUGS } = require('../apps/api/dist/lib/year4-curriculum');
const { seedYear4Curriculum } = require('../apps/api/dist/lib/year4-seed');

test('YEAR4_COURSES defines four senior courses', () => {
  assert.equal(YEAR4_COURSES.length, 4);
  assert.deepEqual(YEAR4_COURSE_SLUGS, [
    'stanford-cs230',
    'stanford-cs224n',
    'stanford-cs231n',
    'stanford-cs-capstone',
  ]);
  for (const def of YEAR4_COURSES) {
    assert.ok(def.termLabel.startsWith('Year 4'), `${def.slug} must be Year 4`);
    assert.equal(def.project.level, 4, `${def.slug} project level`);
    assert.ok(def.sections.length >= 1, `${def.slug} needs sections`);
    assert.ok(def.assignments.length >= 1, `${def.slug} needs assignments`);
    assert.ok(def.project.milestones.length >= 1, `${def.slug} needs milestones`);
  }
});

test('seedYear4Curriculum upserts four Year 4 courses in database', async (t) => {
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

  await seedYear4Curriculum(prisma);

  const year4Courses = await prisma.course.findMany({
    where: { isActive: true, termLabel: { startsWith: 'Year 4' } },
    orderBy: { slug: 'asc' },
  });
  assert.equal(year4Courses.length, 4);

  for (const course of year4Courses) {
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
