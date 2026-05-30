import { FastifyInstance } from 'fastify';
import {
  CourseGradesRollupSchema,
  InstructorCourseGradesResponseSchema,
} from '@nibras/contracts';
import { PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { requestBaseUrl } from '../../lib/request-base-url';
import { validateId } from '../../lib/validate';
import { AppStore } from '../../store';
import { canManageCourse, canViewCourseForRequest } from './policies/access';

async function buildStudentGradesRollup(
  prisma: PrismaClient,
  courseId: string,
  userId: string
) {
  const projects = await prisma.project.findMany({
    where: { courseId, deletedAt: null },
    select: { id: true, slug: true, name: true },
  });

  const projectGrades = await Promise.all(
    projects.map(async (project) => {
      const latest = await prisma.submissionAttempt.findFirst({
        where: { userId, projectId: project.id },
        orderBy: { createdAt: 'desc' },
        include: {
          reviews: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
      const review = latest?.reviews[0];
      return {
        projectId: project.id,
        projectKey: project.slug,
        title: project.name,
        status: latest?.status ?? 'not_started',
        score: review?.score ?? null,
        maxScore: null,
      };
    })
  );

  const assignments = await prisma.courseAssignment.findMany({
    where: { courseId, published: true },
    orderBy: { sortOrder: 'asc' },
  });
  const subs = await prisma.assignmentSubmission.findMany({
    where: {
      userId,
      assignmentId: { in: assignments.map((a) => a.id) },
    },
  });
  const subByAssignment = new Map(subs.map((s) => [s.assignmentId, s]));

  const assignmentGrades = assignments.map((a) => {
    const sub = subByAssignment.get(a.id);
    let status = 'not_started';
    if (sub?.status === 'graded') status = 'graded';
    else if (sub?.status === 'submitted') status = 'submitted';
    else if (sub?.content) status = 'in_progress';
    return {
      assignmentId: a.id,
      title: a.title,
      status,
      score: sub?.score ?? null,
      pointsPossible: a.pointsPossible,
    };
  });

  return { projects: projectGrades, assignments: assignmentGrades };
}

export function registerCourseGradesRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/tracking/courses/:courseId/grades/me',
    { schema: { tags: ['tracking'], summary: 'Student grades rollup for course' } },
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

      const rollup = await buildStudentGradesRollup(prisma, params.courseId, auth.user.id);
      return CourseGradesRollupSchema.parse({
        courseId: params.courseId,
        ...rollup,
      });
    }
  );

  app.get(
    '/v1/tracking/courses/:courseId/grades',
    { schema: { tags: ['tracking'], summary: 'Instructor gradebook for all students in course' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }

      const members = await prisma.courseMembership.findMany({
        where: { courseId: params.courseId, role: 'student' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              githubAccount: { select: { login: true } },
            },
          },
        },
        orderBy: { user: { username: 'asc' } },
      });

      const students = await Promise.all(
        members.map(async (membership) => {
          const rollup = await buildStudentGradesRollup(
            prisma,
            params.courseId,
            membership.userId
          );
          return {
            userId: membership.userId,
            username: membership.user.username,
            githubLogin: membership.user.githubAccount?.login ?? null,
            displayName: membership.user.displayName,
            ...rollup,
          };
        })
      );

      return InstructorCourseGradesResponseSchema.parse({
        courseId: params.courseId,
        students,
      });
    }
  );
}
