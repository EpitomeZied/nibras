import { FastifyInstance } from 'fastify';
import {
  AiCredentialResponseSchema,
  UpsertAiCredentialBodySchema,
} from '@nibras/contracts';
import type { PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { AppStore } from '../../store';
import {
  deleteUserAiCredential,
  getUserAiCredentialPublic,
  upsertUserAiCredential,
} from '../../lib/ai-credentials';

export function registerAiCredentialRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/me/ai-credentials',
    { schema: { tags: ['auth'], summary: 'Get masked AI credential status' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      return AiCredentialResponseSchema.parse(
        await getUserAiCredentialPublic(prisma, auth.user.id)
      );
    }
  );

  app.put(
    '/v1/me/ai-credentials',
    { schema: { tags: ['auth'], summary: 'Save OpenAI API key for Hassona' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const parsed = UpsertAiCredentialBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send(Errors.validation(parsed.error.message));
      }
      if (!parsed.data.apiKey?.trim()) {
        const existing = await prisma.userAiCredential.findUnique({
          where: { userId: auth.user.id },
        });
        if (!existing) {
          return reply.code(400).send(Errors.validation('API key is required.'));
        }
      }
      try {
        await upsertUserAiCredential(
          prisma,
          auth.user.id,
          parsed.data.apiKey,
          parsed.data.model
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not save API key.';
        return reply.code(400).send(Errors.validation(message));
      }
      return AiCredentialResponseSchema.parse(
        await getUserAiCredentialPublic(prisma, auth.user.id)
      );
    }
  );

  app.delete(
    '/v1/me/ai-credentials',
    { schema: { tags: ['auth'], summary: 'Remove personal AI API key' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      await deleteUserAiCredential(prisma, auth.user.id);
      return { ok: true };
    }
  );
}
