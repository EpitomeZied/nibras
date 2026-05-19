import { FastifyInstance } from 'fastify';
import { requireUser } from '../../lib/auth';
import { AppStore } from '../../store';

export function registerCompetitionsRoutes(app: FastifyInstance, store: AppStore): void {
  app.get(
    '/v1/contests',
    { schema: { tags: ['competitions'], summary: 'List contests' } },
    async () => {
      return [];
    }
  );

  app.post(
    '/v1/user-contests/:contestId/reminder',
    { schema: { tags: ['competitions'], summary: 'Set contest reminder' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      const { contestId } = request.params as { contestId: string };
      const { on } = (request.body as { on?: boolean }) ?? {};
      return { reminderSet: on ?? false };
    }
  );

  app.post(
    '/v1/user-contests/:contestId/bookmark',
    { schema: { tags: ['competitions'], summary: 'Bookmark contest' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      const { on } = (request.body as { on?: boolean }) ?? {};
      return { bookmarked: on ?? false };
    }
  );

  app.get(
    '/v1/problems',
    { schema: { tags: ['competitions'], summary: 'List practice problems' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return { items: [], total: 0 };
    }
  );

  app.post(
    '/v1/problems/:problemId/bookmark',
    { schema: { tags: ['competitions'], summary: 'Bookmark problem' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      const { on } = (request.body as { on?: boolean }) ?? {};
      return { bookmarked: on ?? false };
    }
  );

  app.get(
    '/v1/ranking',
    { schema: { tags: ['competitions'], summary: 'Get ranking' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return [];
    }
  );

  app.get(
    '/v1/user-contests/history',
    { schema: { tags: ['competitions'], summary: 'Get my contest history' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return [];
    }
  );

  app.get(
    '/v1/contests/accounts',
    { schema: { tags: ['competitions'], summary: 'Get linked accounts' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return [];
    }
  );

  app.post(
    '/v1/contests/accounts/link',
    { schema: { tags: ['competitions'], summary: 'Link external account' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      const body = request.body as { platform?: string; handle?: string };
      return {
        host: body.platform ?? '',
        handle: body.handle ?? '',
        verified: false,
      };
    }
  );

  app.delete(
    '/v1/contests/accounts/:host',
    { schema: { tags: ['competitions'], summary: 'Unlink external account' } },
    async (request, reply) => {
      await requireUser(request, reply, store);
      return { unlinked: true };
    }
  );
}
