import { FastifyInstance } from 'fastify';
import { requireUser } from '../../lib/auth';
import { AppStore } from '../../store';

export function registerReputationRoutes(app: FastifyInstance, store: AppStore): void {
  app.get(
    '/v1/reputation/me',
    { schema: { tags: ['reputation'], summary: 'Get my reputation' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return { total: 0, weeklyDelta: 0, monthlyDelta: 0, rank: null, percentile: null, history: [] };
    }
  );
}
