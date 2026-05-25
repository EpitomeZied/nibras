import { FastifyInstance } from 'fastify';
import { CourseGradesRollupSchema } from '@nibras/contracts';
import { PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { validateId } from '../../lib/validate';
import { AppStore } from '../../store';
import { canViewCourse } from './policies/access';

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
      if (!canViewCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }

      const projects = await prisma.project.findMany({
        where: { courseId: params.courseId, deletedAt: null },
        select: { id: true, slug: true, name: true },
      });

      const projectGrades = await Promise.all(
        projects.map(async (project) => {
          const latest = await prisma.submissionAttempt.findFirst({
            where: { userId: auth.user.id, projectId: project.id },
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
        where: { courseId: params.courseId, published: true },
        orderBy: { sortOrder: 'asc' },
      });
      const subs = await prisma.assignmentSubmission.findMany({
        where: {
          userId: auth.user.id,
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

      return CourseGradesRollupSchema.parse({
        courseId: params.courseId,
        projects: projectGrades,
        assignments: assignmentGrades,
      });
    }
  );
}
