/**
 * Year 1 Foundation seed — upserts tracking courses, content, and projects.
 */
import {
  CourseRole,
  DeliveryMode,
  Prisma,
  type PrismaClient,
  ProjectStatus,
  SystemRole,
} from '@prisma/client';
import {
  YEAR1_COURSES,
  YEAR1_CS107_COURSE,
  type Year1CourseDefinition,
  type Year1Lecture,
} from './year1-curriculum';

export type Year1SeedOptions = {
  log?: (msg: string) => void;
  instructorUserId?: string;
};

async function resolveInstructorId(
  prisma: PrismaClient,
  overrideId?: string
): Promise<string | null> {
  if (overrideId) return overrideId;

  const demo = await prisma.user.findUnique({
    where: { email: 'instructor@nibras.dev' },
    select: { id: true },
  });
  if (demo) return demo.id;

  const admin = await prisma.user.findFirst({
    where: { systemRole: SystemRole.admin },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return admin?.id ?? null;
}

async function upsertLectureVideos(
  prisma: PrismaClient,
  courseId: string,
  lectures: Year1Lecture[],
  sequential: boolean,
  log: (msg: string) => void
): Promise<void> {
  let previousVideoId: string | null = null;

  for (const lecture of lectures) {
    let section = await prisma.courseSection.findFirst({
      where: { courseId, title: lecture.sectionTitle },
    });
    if (!section) {
      section = await prisma.courseSection.create({
        data: {
          courseId,
          title: lecture.sectionTitle,
          sortOrder: lecture.sortOrder,
        },
      });
    } else {
      section = await prisma.courseSection.update({
        where: { id: section.id },
        data: { sortOrder: lecture.sortOrder },
      });
    }

    const videoTitle = lecture.sectionTitle.replace(/^Lecture \d+: /, '');
    let video = await prisma.courseVideo.findFirst({
      where: { sectionId: section.id, title: videoTitle },
    });

    const requiresVideoId: string | null = sequential && previousVideoId ? previousVideoId : null;

    if (!video) {
      video = await prisma.courseVideo.create({
        data: {
          sectionId: section.id,
          title: videoTitle,
          description: lecture.sectionTitle,
          provider: 'youtube',
          externalId: lecture.youtubeId,
          embedUrl: null,
          sortOrder: 0,
          requiresVideoId,
        },
      });
    } else {
      video = await prisma.courseVideo.update({
        where: { id: video.id },
        data: {
          title: videoTitle,
          description: lecture.sectionTitle,
          provider: 'youtube',
          externalId: lecture.youtubeId,
          embedUrl: null,
          sortOrder: 0,
          requiresVideoId,
        },
      });
    }

    previousVideoId = video.id;
    log(`   🎬 Video: ${videoTitle}`);
  }
}

async function upsertCourseContent(
  prisma: PrismaClient,
  def: Year1CourseDefinition,
  log: (msg: string) => void
): Promise<{ courseId: string }> {
  const course = await prisma.course.upsert({
    where: { slug: def.slug },
    update: {
      title: def.title,
      termLabel: def.termLabel,
      courseCode: def.courseCode,
      description: def.description,
      syllabusJson: def.syllabusJson ?? Prisma.JsonNull,
      sequentialVideos: def.sequentialVideos ?? false,
      isActive: true,
      isPublic: false,
    },
    create: {
      slug: def.slug,
      title: def.title,
      termLabel: def.termLabel,
      courseCode: def.courseCode,
      description: def.description,
      syllabusJson: def.syllabusJson ?? Prisma.JsonNull,
      sequentialVideos: def.sequentialVideos ?? false,
      isActive: true,
      isPublic: false,
    },
  });
  log(`✅ Course: [${def.courseCode}] ${def.title} (${def.termLabel})`);

  for (const sec of def.sections) {
    const existing = await prisma.courseSection.findFirst({
      where: { courseId: course.id, title: sec.title },
    });
    if (!existing) {
      await prisma.courseSection.create({
        data: { courseId: course.id, title: sec.title, sortOrder: sec.sortOrder },
      });
    } else {
      await prisma.courseSection.update({
        where: { id: existing.id },
        data: { sortOrder: sec.sortOrder },
      });
    }
  }

  for (const asgn of def.assignments) {
    const existing = await prisma.courseAssignment.findFirst({
      where: { courseId: course.id, title: asgn.title },
    });
    const data = {
      description: asgn.description,
      content: asgn.content,
      pointsPossible: asgn.pointsPossible,
      sortOrder: asgn.sortOrder,
      dueAt: new Date(asgn.dueAt),
      published: true,
    };
    if (!existing) {
      await prisma.courseAssignment.create({
        data: { courseId: course.id, title: asgn.title, ...data },
      });
      log(`   📝 Assignment: ${asgn.title}`);
    } else {
      await prisma.courseAssignment.update({
        where: { id: existing.id },
        data,
      });
    }
  }

  if (def.lectures?.length) {
    await upsertLectureVideos(prisma, course.id, def.lectures, def.sequentialVideos ?? false, log);
  }

  return { courseId: course.id };
}

async function upsertProject(
  prisma: PrismaClient,
  courseId: string,
  def: Year1CourseDefinition,
  log: (msg: string) => void
): Promise<void> {
  const proj = def.project;
  const subject = await prisma.subject.upsert({
    where: { slug: proj.subject.slug },
    update: { name: proj.subject.name },
    create: { slug: proj.subject.slug, name: proj.subject.name },
  });

  let project = await prisma.project.findUnique({ where: { slug: proj.slug } });
  if (project) {
    project = await prisma.project.update({
      where: { id: project.id },
      data: {
        courseId,
        subjectId: subject.id,
        name: proj.name,
        description: proj.description,
        status: ProjectStatus.published,
        deliveryMode: DeliveryMode.individual,
        level: proj.level,
        rubricJson: proj.rubric as Prisma.InputJsonValue,
        resourcesJson: (proj.resourcesJson ?? []) as Prisma.InputJsonValue,
      },
    });
    log(`   ↩  Project: ${proj.name}`);
  } else {
    project = await prisma.project.create({
      data: {
        subjectId: subject.id,
        courseId,
        slug: proj.slug,
        name: proj.name,
        description: proj.description,
        status: ProjectStatus.published,
        deliveryMode: DeliveryMode.individual,
        level: proj.level,
        rubricJson: proj.rubric as Prisma.InputJsonValue,
        resourcesJson: (proj.resourcesJson ?? []) as Prisma.InputJsonValue,
      },
    });
    log(`   ✓  Project: ${proj.name}`);
  }

  const existingMs = await prisma.milestone.count({ where: { projectId: project.id } });
  if (existingMs === 0) {
    for (const ms of proj.milestones) {
      await prisma.milestone.create({
        data: {
          projectId: project.id,
          title: ms.title,
          description: ms.description,
          order: ms.order,
          isFinal: ms.isFinal ?? false,
        },
      });
    }
    log(`        → ${proj.milestones.length} milestones`);
  }
}

async function ensureInstructorMembership(
  prisma: PrismaClient,
  courseId: string,
  instructorId: string,
  level: number
): Promise<void> {
  await prisma.courseMembership.upsert({
    where: { courseId_userId: { courseId, userId: instructorId } },
    update: { role: CourseRole.instructor, level },
    create: {
      courseId,
      userId: instructorId,
      role: CourseRole.instructor,
      level,
    },
  });
}

export async function seedYear1Course(
  prisma: PrismaClient,
  def: Year1CourseDefinition,
  options?: Year1SeedOptions
): Promise<void> {
  const log = options?.log ?? (() => {});
  const { courseId } = await upsertCourseContent(prisma, def, log);
  await upsertProject(prisma, courseId, def, log);

  const instructorId = await resolveInstructorId(prisma, options?.instructorUserId);
  if (instructorId) {
    await ensureInstructorMembership(prisma, courseId, instructorId, def.project.level);
  }
}

/** Seed all seven Year 1 Foundation tracking courses. */
export async function seedYear1Curriculum(
  prisma: PrismaClient,
  options?: Year1SeedOptions
): Promise<void> {
  const log = options?.log ?? (() => {});
  log('🎓 Seeding Year 1 Foundation (7 courses)…\n');

  for (const def of YEAR1_COURSES) {
    await seedYear1Course(prisma, def, options);
    log('');
  }

  log('✅ Year 1 curriculum seed complete.');
}

/** Seed CS 107 as Year 2 sophomore course. */
export async function seedYear2Cs107(
  prisma: PrismaClient,
  options?: Year1SeedOptions
): Promise<void> {
  await seedYear1Course(prisma, YEAR1_CS107_COURSE, options);
}
