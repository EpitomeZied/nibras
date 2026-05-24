import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { AppStore } from '../../store';

export function registerAnalyticsRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/analytics/overview',
    { schema: { tags: ['analytics'], summary: 'Analytics overview' } },
    async (request, reply) => {
      await requireUser(request, reply, store);

      const totalStudents = await prisma.user.count();
      const totalSubmissions = await prisma.submissionAttempt.count();

      return {
        kpis: {
          activeStudents: totalStudents,
          activeStudentsDelta: 0,
          submissionsThisWeek: 0,
          submissionsDelta: 0,
          passRate: 0,
          passRateDelta: 0,
          medianGrade: 0,
        },
        series: {
          submissions: [],
          passRate: [],
        },
        topRisingTopics: [],
        flaggedCohorts: [],
      };
    }
  );

  app.get(
    '/v1/analytics/courses',
    { schema: { tags: ['analytics'], summary: 'Course summaries' } },
    async (request, reply) => {
      await requireUser(request, reply, store);

      const courses = await prisma.course.findMany({
        select: { id: true, courseCode: true, title: true },
      });

      return courses.map((c) => ({
        courseId: c.id,
        code: c.courseCode,
        title: c.title,
        enrolled: 0,
        activeWeekly: 0,
        completionRate: 0,
        averageGrade: 0,
        passRate: 0,
      }));
    }
  );

  app.get(
    '/v1/analytics/engagement',
    { schema: { tags: ['analytics'], summary: 'Engagement analytics' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return {
        totalHours: 0,
        averageSession: 0,
        retentionWeekly: 0,
        byDay: [],
        byCourse: [],
      };
    }
  );

  app.get(
    '/v1/analytics/students',
    { schema: { tags: ['analytics'], summary: 'Student analytics' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return { rows: [], total: 0 };
    }
  );
}
