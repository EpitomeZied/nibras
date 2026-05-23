import { FastifyInstance } from 'fastify';
import { CompPlatform, PrismaClient } from '@prisma/client';
import { optionalUser } from '../../lib/auth';
import { AppStore } from '../../store';
import { fetchPracticeLcAnalytics } from './practice/leetcode/leetcode-client';
import { fetchNibras75Problems, getNibras75Meta } from './practice/nibras75/nibras75-client';

async function resolveLeetcodeHandle(
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

export function registerNibras75Routes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/practice/nibras-75/problems',
    { schema: { tags: ['competitions'], summary: 'Nibras 75 curated interview problems' } },
    async (request, reply) => {
      const user = await optionalUser(request, reply, store);
      const q = request.query as {
        handle?: string;
        q?: string;
        difficulty?: string;
        solved?: string;
      };

      try {
        const handle = await resolveLeetcodeHandle(prisma, user?.id, q.handle);
        const difficulty =
          q.difficulty === 'easy' || q.difficulty === 'medium' || q.difficulty === 'hard'
            ? q.difficulty
            : undefined;
        const solved =
          q.solved === 'true' || q.solved === 'false' ? (q.solved as 'true' | 'false') : undefined;

        const result = await fetchNibras75Problems(handle, user?.id, prisma, {
          q: q.q,
          difficulty,
          solved,
        });
        const meta = getNibras75Meta();

        return {
          ...meta,
          totalCurriculum: meta.total,
          items: result.items,
          total: result.total,
          solvedCount: result.solvedCount,
          completedInSet: result.completedInSet,
          handle: handle ?? null,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(502).send({ error: message });
      }
    }
  );

  app.get(
    '/v1/practice/nibras-75/analytics',
    { schema: { tags: ['competitions'], summary: 'LeetCode analytics for Nibras 75 (linked handle)' } },
    async (request, reply) => {
      const user = await optionalUser(request, reply, store);
      const query = request.query as { handle?: string };

      try {
        const handle = await resolveLeetcodeHandle(prisma, user?.id, query.handle);
        if (!handle?.trim()) {
          return reply.status(400).send({
            error: 'LeetCode username is required (link account or pass handle)',
          });
        }
        const body = await fetchPracticeLcAnalytics(handle);
        return { ...body, handle };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(502).send({ error: message });
      }
    }
  );
}
