import { FastifyInstance } from 'fastify';
import { CompPlatform, PrismaClient } from '@prisma/client';
import { optionalUser } from '../../lib/auth';
import { AppStore } from '../../store';
import {
  fetchPracticeLcAnalytics,
  fetchPracticeLcProblems,
} from './practice/leetcode/leetcode-client';
import type { LcAnalyticsPayload, PracticeLcProblemsResponse } from './practice/leetcode/types';

async function resolveHandle(
  prisma: PrismaClient,
  userId: string | undefined,
  queryHandle?: string
): Promise<string | undefined> {
  if (queryHandle?.trim()) return queryHandle.trim();
  if (!userId) return undefined;

  const account = await prisma.linkedAccount.findUnique({
    where: { userId_platform: { userId, platform: 'leetcode' as CompPlatform } },
  });
  return account?.handle;
}

export function registerPracticeLeetcodeRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/practice/leetcode/problems',
    { schema: { tags: ['competitions'], summary: 'LeetCode practice problems (full problemset, paginated)' } },
    async (request, reply) => {
      const user = await optionalUser(request, reply, store);
      const q = request.query as {
        handle?: string;
        page?: string;
        limit?: string;
        q?: string;
        tag?: string;
        difficulty?: string;
        solved?: string;
      };

      try {
        const handle = await resolveHandle(prisma, user?.id, q.handle);
        const page = q.page ? parseInt(q.page, 10) : 1;
        const limit = q.limit ? parseInt(q.limit, 10) : 100;
        const difficulty =
          q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard'
            ? q.difficulty
            : undefined;
        const solved =
          q.solved === 'true' || q.solved === 'false' ? (q.solved as 'true' | 'false') : undefined;

        const result = await fetchPracticeLcProblems(handle, user?.id, prisma, {
          page: Number.isFinite(page) ? page : 1,
          limit: Number.isFinite(limit) ? limit : 100,
          q: q.q,
          tag: q.tag,
          difficulty,
          solved,
        });

        const body: PracticeLcProblemsResponse = {
          items: result.items,
          total: result.total,
          solvedCount: result.solvedCount,
          handle: handle ?? null,
          page: result.page,
          limit: result.limit,
        };
        return body;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(502).send({ error: message });
      }
    }
  );

  app.get(
    '/v1/practice/leetcode/analytics',
    { schema: { tags: ['competitions'], summary: 'LeetCode profile analytics for a handle' } },
    async (request, reply) => {
      const user = await optionalUser(request, reply, store);
      const query = request.query as { handle?: string };

      try {
        const handle = await resolveHandle(prisma, user?.id, query.handle);
        if (!handle?.trim()) {
          return reply.status(400).send({
            error: 'LeetCode username is required (link account or pass handle)',
          });
        }

        const body: LcAnalyticsPayload = await fetchPracticeLcAnalytics(handle);
        return { ...body, handle };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(502).send({ error: message });
      }
    }
  );
}
