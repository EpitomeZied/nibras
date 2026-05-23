import { FastifyInstance } from 'fastify';
import { CompPlatform, PrismaClient } from '@prisma/client';
import { optionalUser } from '../../lib/auth';
import { AppStore } from '../../store';
import { fetchCodeforcesCodehuntProblems } from './codehunt/codeforces-client';
import { fetchUhuntCodehuntProblems } from './codehunt/uhunt-client';
import type { CodehuntProblemsResponse } from './codehunt/types';

async function resolveHandle(
  prisma: PrismaClient,
  userId: string | undefined,
  platform: CompPlatform,
  queryHandle?: string
): Promise<string | undefined> {
  if (queryHandle?.trim()) return queryHandle.trim();
  if (!userId) return undefined;

  const account = await prisma.linkedAccount.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  return account?.handle;
}

export function registerCodehuntRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/codehunt/uhunt/problems',
    { schema: { tags: ['competitions'], summary: 'Codehunt uHunt problems (last 1000)' } },
    async (request, reply) => {
      const user = await optionalUser(request, reply, store);
      const query = request.query as { handle?: string };

      try {
        const handle = await resolveHandle(prisma, user?.id, 'uhunt', query.handle);
        const { items, solvedCount } = await fetchUhuntCodehuntProblems(handle);
        const body: CodehuntProblemsResponse = {
          items,
          total: items.length,
          solvedCount,
          handle: handle ?? null,
        };
        return body;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(502).send({ error: message });
      }
    }
  );

  app.get(
    '/v1/codehunt/codeforces/problems',
    { schema: { tags: ['competitions'], summary: 'Codehunt Codeforces problems (recent 1000 contests)' } },
    async (request, reply) => {
      const user = await optionalUser(request, reply, store);
      const query = request.query as { handle?: string };

      try {
        const handle = await resolveHandle(prisma, user?.id, 'codeforces', query.handle);
        const { items, solvedCount } = await fetchCodeforcesCodehuntProblems(handle);
        const body: CodehuntProblemsResponse = {
          items,
          total: items.length,
          solvedCount,
          handle: handle ?? null,
        };
        return body;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(502).send({ error: message });
      }
    }
  );
}
