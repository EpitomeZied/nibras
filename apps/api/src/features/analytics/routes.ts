import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { AppStore } from '../../store';
import {
  assertInstructorAccess,
  buildCourseSummaries,
  buildEngagement,
  buildOverview,
  buildStudents,
  resolveDateRange,
  resolveManagedCourseIds,
  type AnalyticsQuery,
} from './aggregate';

export function registerAnalyticsRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  async function guardInstructor(request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) {
    const auth = await requireUser(request, reply, store);
    if (!auth) return null;
    if (!assertInstructorAccess(auth)) {
      reply.code(403).send(Errors.forbidden());
      return null;
    }
    const courseIds = await resolveManagedCourseIds(auth, prisma);
    if (courseIds.length === 0 && auth.user.systemRole !== 'admin') {
      reply.code(403).send(Errors.forbidden());
      return null;
    }
    return { auth, courseIds };
  }

  app.get(
    '/v1/analytics/overview',
    { schema: { tags: ['analytics'], summary: 'Analytics overview' } },
    async (request, reply) => {
      const ctx = await guardInstructor(request, reply);
      if (!ctx) return;
      const query = request.query as AnalyticsQuery;
      const resolved = await resolveDateRange(query, ctx.courseIds, prisma);
      if ('error' in resolved) {
        return reply.code(400).send(resolved.error);
      }
      return buildOverview(prisma, resolved.courseIds, resolved.range);
    }
  );

  app.get(
    '/v1/analytics/courses',
    { schema: { tags: ['analytics'], summary: 'Course summaries' } },
    async (request, reply) => {
      const ctx = await guardInstructor(request, reply);
      if (!ctx) return;
      const query = request.query as AnalyticsQuery;
      const resolved = await resolveDateRange(query, ctx.courseIds, prisma);
      if ('error' in resolved) {
        return reply.code(400).send(resolved.error);
      }
      return buildCourseSummaries(prisma, resolved.courseIds, resolved.range);
    }
  );

  app.get(
    '/v1/analytics/engagement',
    { schema: { tags: ['analytics'], summary: 'Engagement analytics' } },
    async (request, reply) => {
      const ctx = await guardInstructor(request, reply);
      if (!ctx) return;
      const query = request.query as AnalyticsQuery;
      const resolved = await resolveDateRange(query, ctx.courseIds, prisma);
      if ('error' in resolved) {
        return reply.code(400).send(resolved.error);
      }
      return buildEngagement(prisma, resolved.courseIds, resolved.range);
    }
  );

  app.get(
    '/v1/analytics/students',
    { schema: { tags: ['analytics'], summary: 'Student analytics' } },
    async (request, reply) => {
      const ctx = await guardInstructor(request, reply);
      if (!ctx) return;
      const query = request.query as AnalyticsQuery;
      const resolved = await resolveDateRange(query, ctx.courseIds, prisma);
      if ('error' in resolved) {
        return reply.code(400).send(resolved.error);
      }
      return buildStudents(prisma, resolved.courseIds, resolved.range, {
        cohort: query.cohort,
        risk: query.risk,
      });
    }
  );
}
