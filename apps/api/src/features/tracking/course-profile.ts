import { FastifyInstance } from 'fastify';
import {
  TrackingCourseDetailSchema,
  UpdateCourseProfileRequestSchema,
} from '@nibras/contracts';
import { Prisma, PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { requestBaseUrl } from '../../lib/request-base-url';
import { validateId } from '../../lib/validate';
import { AppStore } from '../../store';
import { canManageCourse, canViewCourseForRequest } from './policies/access';

async function buildCourseDetail(
  prisma: PrismaClient,
  courseId: string,
  userId: string
) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
  });
  if (!course) return null;

  const [videoCount, assignmentCount, publishedAssignmentCount, projectCount, progressAgg] =
    await Promise.all([
      prisma.courseVideo.count({
        where: { section: { courseId } },
      }),
      prisma.courseAssignment.count({ where: { courseId } }),
      prisma.courseAssignment.count({ where: { courseId, published: true } }),
      prisma.project.count({ where: { courseId, deletedAt: null } }),
      prisma.videoProgress.aggregate({
        where: {
          userId,
          video: { section: { courseId } },
        },
        _avg: { watchedProgress: true },
        _count: { id: true },
      }),
    ]);

  const videoProgressPercent =
    videoCount > 0 && progressAgg._count.id > 0
      ? Math.round((progressAgg._avg.watchedProgress ?? 0) * 100)
      : 0;

  return TrackingCourseDetailSchema.parse({
    id: course.id,
    slug: course.slug,
    title: course.title,
    termLabel: course.termLabel,
    courseCode: course.courseCode,
    isActive: course.isActive,
    isPublic: course.isPublic,
    description: course.description || undefined,
    thumbnailUrl: course.thumbnailUrl,
    syllabusJson: course.syllabusJson as Record<string, unknown> | null,
    sequentialVideos: course.sequentialVideos,
    videoProgressPercent,
    videoCount,
    assignmentCount,
    publishedAssignmentCount,
    projectCount,
  });
}

export function registerCourseProfileRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/tracking/courses/:courseId/detail',
    { schema: { tags: ['tracking'], summary: 'Course detail with progress summary' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      const apiBaseUrl = requestBaseUrl(request);
      if (!(await canViewCourseForRequest(store, apiBaseUrl, auth, params.courseId))) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const detail = await buildCourseDetail(prisma, params.courseId, auth.user.id);
      if (!detail) {
        reply.code(404).send(Errors.notFound('Course'));
        return;
      }
      return detail;
    }
  );

  app.patch(
    '/v1/tracking/courses/:courseId/profile',
    { schema: { tags: ['tracking'], summary: 'Update course profile (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const body = UpdateCourseProfileRequestSchema.parse(request.body ?? {});
      const existing = await prisma.course.findFirst({
        where: { id: params.courseId, deletedAt: null },
      });
      if (!existing) {
        reply.code(404).send(Errors.notFound('Course'));
        return;
      }
      await prisma.course.update({
        where: { id: params.courseId },
        data: {
          title: body.title,
          termLabel: body.termLabel,
          courseCode: body.courseCode,
          description: body.description,
          thumbnailUrl: body.thumbnailUrl === null ? null : body.thumbnailUrl,
          syllabusJson:
            body.syllabusJson === null
              ? Prisma.JsonNull
              : body.syllabusJson === undefined
                ? undefined
                : (body.syllabusJson as Prisma.InputJsonValue),
          sequentialVideos: body.sequentialVideos,
          isPublic: body.isPublic,
        },
      });
      const detail = await buildCourseDetail(prisma, params.courseId, auth.user.id);
      return detail;
    }
  );
}
