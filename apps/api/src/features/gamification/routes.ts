import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { AppStore } from '../../store';
import { BADGE_CATALOG } from './badges-catalog';
import { GamificationService } from './service';

export function registerGamificationRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  const gamification = new GamificationService(prisma);

  app.addHook('onReady', async () => {
    try {
      const count = await gamification.ensureBadgeCatalog();
      gamification.markCatalogSynced();
      app.log.info(
        { count, expected: BADGE_CATALOG.length },
        'Badge catalog synced on API ready'
      );
      if (count < BADGE_CATALOG.length) {
        app.log.warn('Badge catalog incomplete after sync');
      }
    } catch (err) {
      app.log.error({ err }, 'Failed to sync badge catalog on startup');
    }
  });

  app.get(
    '/v1/gamification/achievements-dashboard',
    { schema: { tags: ['gamification'], summary: 'Achievements page data (badges + reputation)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const query = request.query as { sync?: string };
      const forceSync = query.sync === 'true' || query.sync === '1';

      return gamification.getAchievementsDashboard(auth.user.id, { sync: forceSync });
    }
  );

  app.get(
    '/v1/gamification/all-badges',
    { schema: { tags: ['gamification'], summary: 'List all badges' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const badges = await gamification.listBadgesForUser(auth.user.id);
      return { badges };
    }
  );

  app.post(
    '/v1/gamification/check-award',
    { schema: { tags: ['gamification'], summary: 'Check and award badges' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const awarded = await gamification.checkAndAwardBadges(auth.user.id);
      return { awarded };
    }
  );

  app.get(
    '/v1/gamification/leaderboards',
    { schema: { tags: ['gamification'], summary: 'Get leaderboard' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const query = request.query as {
        period?: string;
        scope?: string;
        courseId?: string;
        page?: string;
        limit?: string;
      };
      const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '25', 10) || 25));
      const period = (['all', 'month', 'week', 'today'].includes(query.period || '')
        ? query.period
        : 'all') as 'all' | 'month' | 'week' | 'today';
      const scope = (['global', 'course', 'cohort'].includes(query.scope || '')
        ? query.scope
        : 'global') as 'global' | 'course' | 'cohort';

      return gamification.getLeaderboard(auth.user.id, {
        period,
        scope,
        courseId: query.courseId,
        page,
        limit,
      });
    }
  );

  app.get(
    '/v1/gamification/leaderboards/me',
    { schema: { tags: ['gamification'], summary: 'Get my leaderboard rank' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const query = request.query as { period?: string; scope?: string; courseId?: string };
      const period = (['all', 'month', 'week', 'today'].includes(query.period || '')
        ? query.period
        : 'all') as 'all' | 'month' | 'week' | 'today';
      const scope = (['global', 'course', 'cohort'].includes(query.scope || '')
        ? query.scope
        : 'global') as 'global' | 'course' | 'cohort';

      return gamification.getMyLeaderboardRank(auth.user.id, {
        period,
        scope,
        courseId: query.courseId,
      });
    }
  );

  app.get(
    '/v1/gamification/leaderboards/config',
    { schema: { tags: ['gamification'], summary: 'Get leaderboard config' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return {
        periods: [
          { value: 'all', label: 'All Time' },
          { value: 'month', label: 'This Month' },
          { value: 'week', label: 'This Week' },
          { value: 'today', label: 'Today' },
        ],
        scopes: [
          { value: 'global', label: 'Global' },
          { value: 'course', label: 'Course' },
          { value: 'cohort', label: 'Cohort' },
        ],
      };
    }
  );
}
