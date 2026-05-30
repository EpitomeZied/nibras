'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { YEAR3_COURSES, YEAR3_COURSE_SLUGS } = require('../apps/api/dist/lib/year3-curriculum');
const { seedYear3Curriculum } = require('../apps/api/dist/lib/year3-seed');

test('YEAR3_COURSES defines six junior courses', () => {
  assert.equal(YEAR3_COURSES.length, 6);
  assert.deepEqual(YEAR3_COURSE_SLUGS, [
    'stanford-cs221',
    'stanford-cs229',
    'year3-cs301',
    'stanford-cs246',
    'stanford-cs255',
    'year3-cs302',
  ]);
  for (const def of YEAR3_COURSES) {
    assert.ok(def.termLabel.startsWith('Year 3'), `${def.slug} must be Year 3`);
    assert.equal(def.project.level, 3, `${def.slug} project level`);
    assert.ok(def.sections.length >= 1, `${def.slug} needs sections`);
    assert.ok(def.assignments.length >= 1, `${def.slug} needs assignments`);
    assert.ok(def.project.milestones.length >= 1, `${def.slug} needs milestones`);
  }
});

test('seedYear3Curriculum upserts six Year 3 courses in database', async (t) => {
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

  await seedYear3Curriculum(prisma);

  const year3Courses = await prisma.course.findMany({
    where: { isActive: true, termLabel: { startsWith: 'Year 3' } },
    orderBy: { slug: 'asc' },
  });
  assert.equal(year3Courses.length, 6);

  for (const course of year3Courses) {
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
