import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { AppStore } from '../../store';
import { ReputationService } from './service';

export function registerReputationRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  const reputation = new ReputationService(prisma);

  app.get(
    '/v1/reputation/me',
    { schema: { tags: ['reputation'], summary: 'Get my reputation' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      return reputation.getMyReputation(auth.user.id);
    }
  );
}
