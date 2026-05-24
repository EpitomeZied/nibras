import { FastifyInstance } from 'fastify';
import { CompPlatform, PrismaClient } from '@prisma/client';
import { GitHubRequestError, type GitHubAppConfig } from '@nibras/github';
import { optionalUser, requireUser } from '../../lib/auth';
import { AppStore } from '../../store';
import { fetchPracticeLcAnalytics } from './practice/leetcode/leetcode-client';
import {
  fetchNibras75Problems,
  getNibras75Meta,
  setNibras75ProblemSolved,
} from './practice/nibras75/nibras75-client';
import { forkNibras75Workspace, getNibras75Workspace } from './practice/nibras75/nibras75-fork';

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
  prisma: PrismaClient,
  githubConfig: GitHubAppConfig | null
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

  app.post(
    '/v1/practice/nibras-75/problems/:slug/solved',
    { schema: { tags: ['competitions'], summary: 'Mark a Nibras 75 problem solved or unsolved' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;

      const { slug } = request.params as { slug: string };
      const body = request.body as { solved?: boolean };
      if (typeof body.solved !== 'boolean') {
        return reply.status(400).send({ error: 'solved (boolean) is required' });
      }

      try {
        const result = await setNibras75ProblemSolved(
          prisma,
          auth.user.id,
          slug,
          body.solved
        );
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const status = message.includes('not part') ? 404 : 502;
        return reply.status(status).send({ error: message });
      }
    }
  );

  app.get(
    '/v1/practice/nibras-75/workspace',
    { schema: { tags: ['competitions'], summary: 'Get Nibras 75 GitHub workspace fork' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;

      const workspace = await getNibras75Workspace(prisma, auth.user.id);
      return { workspace };
    }
  );

  app.post(
    '/v1/practice/nibras-75/workspace/fork',
    { schema: { tags: ['competitions'], summary: 'Fork Nibras 75 template repo on GitHub' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;

      try {
        const workspace = await forkNibras75Workspace(
          prisma,
          store,
          githubConfig,
          auth.user.id
        );
        return { workspace };
      } catch (err) {
        let message = err instanceof Error ? err.message : String(err);
        let status = 502;

        if (message.includes('Link your GitHub')) {
          status = 400;
        } else if (err instanceof GitHubRequestError) {
          status = err.statusCode >= 500 ? 502 : 400;
          try {
            const parsed = JSON.parse(err.bodyText);
            if (parsed.message) {
              message = parsed.message;
            }
          } catch {
            // Keep original message if parsing fails
          }
        }
        return reply.status(status).send({ error: message });
      }
    }
  );
}
