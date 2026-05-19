import { FastifyInstance } from 'fastify';
import { requireUser } from '../../lib/auth';
import { AppStore } from '../../store';

export function registerGamificationRoutes(app: FastifyInstance, store: AppStore): void {
  app.get(
    '/v1/gamification/all-badges',
    { schema: { tags: ['gamification'], summary: 'List all badges' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return { badges: [] };
    }
  );

  app.post(
    '/v1/gamification/check-award',
    { schema: { tags: ['gamification'], summary: 'Check and award badges' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return { awarded: [] };
    }
  );

  app.get(
    '/v1/gamification/leaderboards',
    { schema: { tags: ['gamification'], summary: 'Get leaderboard' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return { entries: [], total: 0, page: 1, limit: 25 };
    }
  );

  app.get(
    '/v1/gamification/leaderboards/me',
    { schema: { tags: ['gamification'], summary: 'Get my leaderboard rank' } },
    async (request, reply) => {
      const user = await requireUser(request, reply, store);
      return { rank: null, score: 0, delta: 0, level: 1, badges: 0 };
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
        ],
      };
    }
  );
}
