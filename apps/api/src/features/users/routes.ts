import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { UserProfileResponseSchema } from '@nibras/contracts';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { requestBaseUrl } from '../../lib/request-base-url';
import { AppStore } from '../../store';
import { resolveProfileVisibility } from './policies/visibility';
import { UserProfileService } from './service';

export function registerUserRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma?: PrismaClient
): void {
  const profileService = new UserProfileService(prisma ?? null);

  app.get(
    '/v1/users/:userId',
    { schema: { tags: ['users'], summary: 'Get user profile (scoped visibility)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;

      const params = request.params as { userId: string };
      const apiBaseUrl = requestBaseUrl(request);

      const targetExists = await profileService.loadTargetUser(store, apiBaseUrl, params.userId);
      if (!targetExists) {
        return reply.code(404).send(Errors.notFound('User not found.'));
      }

      const visibility = await resolveProfileVisibility(
        auth,
        params.userId,
        store,
        apiBaseUrl,
        prisma
      );
      if (!visibility.allowed) {
        return reply.code(403).send(Errors.forbidden());
      }

      const payload = await profileService.buildProfileResponse(
        store,
        apiBaseUrl,
        params.userId,
        visibility.viewerRole
      );
      if (!payload) {
        return reply.code(404).send(Errors.notFound('User not found.'));
      }

      return UserProfileResponseSchema.parse(payload);
    }
  );
}
