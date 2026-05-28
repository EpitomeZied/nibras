import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { AppStore } from '../../store';
import {
  getTodayAssignment,
  solveTodayProblem,
  skipTodayProblem,
  pauseDaily,
  resumeDaily,
  getDailyHistory,
  getDailyStats,
  getOrCreateConfig,
} from './service';

export function registerDailyProblemRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/daily-problem/today',
    { schema: { tags: ['daily-problem'], summary: "Get today's daily problem" } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const result = await getTodayAssignment(prisma, auth.user.id);
      return reply.send(result);
    }
  );

  app.post(
    '/v1/daily-problem/today/solve',
    { schema: { tags: ['daily-problem'], summary: "Mark today's problem as solved" } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const result = await solveTodayProblem(prisma, auth.user.id);
      if (!result.success) {
        return reply.code(400).send({ error: result.error });
      }
      return reply.send(result);
    }
  );

  app.post(
    '/v1/daily-problem/today/skip',
    { schema: { tags: ['daily-problem'], summary: "Skip today's problem (uses a streak freeze)" } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const result = await skipTodayProblem(prisma, auth.user.id);
      if (!result.success) {
        return reply.code(400).send({ error: result.error });
      }
      return reply.send(result);
    }
  );

  app.get(
    '/v1/daily-problem/config',
    { schema: { tags: ['daily-problem'], summary: 'Get daily problem configuration' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const config = await getOrCreateConfig(prisma, auth.user.id);
      return reply.send({
        enabled: config.enabled,
        difficultyPref: config.difficultyPref,
        tagPrefs: config.tagPrefs,
        timezone: config.timezone,
        pausedUntil: config.pausedUntil?.toISOString() ?? null,
        streakFreezes: config.streakFreezes,
      });
    }
  );

  app.patch(
    '/v1/daily-problem/config',
    { schema: { tags: ['daily-problem'], summary: 'Update daily problem configuration' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as {
        enabled?: boolean;
        difficultyPref?: number[];
        tagPrefs?: string[];
        timezone?: string;
      };

      const data: {
        enabled?: boolean;
        difficultyPref?: number[];
        tagPrefs?: string[];
        timezone?: string;
      } = {};
      if (typeof body.enabled === 'boolean') data.enabled = body.enabled;
      if (Array.isArray(body.difficultyPref)) data.difficultyPref = body.difficultyPref;
      if (Array.isArray(body.tagPrefs)) data.tagPrefs = body.tagPrefs;
      if (typeof body.timezone === 'string') data.timezone = body.timezone;

      const config = await prisma.dailyProblemConfig.upsert({
        where: { userId: auth.user.id },
        create: { userId: auth.user.id, ...data },
        update: data,
      });

      return reply.send({
        enabled: config.enabled,
        difficultyPref: config.difficultyPref,
        tagPrefs: config.tagPrefs,
        timezone: config.timezone,
        pausedUntil: config.pausedUntil?.toISOString() ?? null,
        streakFreezes: config.streakFreezes,
      });
    }
  );

  app.post(
    '/v1/daily-problem/pause',
    { schema: { tags: ['daily-problem'], summary: 'Pause daily problems (vacation mode)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as { days?: number };
      const days = typeof body.days === 'number' ? body.days : 7;
      const result = await pauseDaily(prisma, auth.user.id, days);
      return reply.send(result);
    }
  );

  app.post(
    '/v1/daily-problem/resume',
    { schema: { tags: ['daily-problem'], summary: 'Resume daily problems' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      await resumeDaily(prisma, auth.user.id);
      return reply.send({ ok: true });
    }
  );

  app.get(
    '/v1/daily-problem/history',
    { schema: { tags: ['daily-problem'], summary: 'Get daily problem history' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const query = request.query as { page?: string; limit?: string };
      const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10) || 20));
      const result = await getDailyHistory(prisma, auth.user.id, page, limit);
      return reply.send(result);
    }
  );

  app.get(
    '/v1/daily-problem/stats',
    { schema: { tags: ['daily-problem'], summary: 'Get daily problem statistics and calendar' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const result = await getDailyStats(prisma, auth.user.id);
      return reply.send(result);
    }
  );
}
