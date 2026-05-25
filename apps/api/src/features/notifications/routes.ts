import { FastifyInstance } from 'fastify';
import { normalizeNotificationEmail } from '@nibras/contracts';
import { AppStore } from '../../store';
import { requireUser } from '../../lib/auth';
import { requestBaseUrl } from '../../lib/request-base-url';

export function registerNotificationRoutes(app: FastifyInstance, store: AppStore): void {
  /**
   * GET /v1/notifications
   * List the current user's notifications (latest 50).
   */
  app.get(
    '/v1/notifications',
    { schema: { tags: ['notifications'], summary: 'List notifications for current user' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const notifications = await store.listNotifications(requestBaseUrl(request), auth.user.id);
      return { notifications };
    }
  );

  /**
   * GET /v1/notifications/count
   * Return the unread notification count. Lightweight — safe to poll frequently.
   */
  app.get(
    '/v1/notifications/count',
    { schema: { tags: ['notifications'], summary: 'Count unread notifications' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const count = await store.countUnreadNotifications(requestBaseUrl(request), auth.user.id);
      return { count };
    }
  );

  /**
   * POST /v1/notifications/read-all
   * Mark all of the current user's notifications as read.
   */
  app.post(
    '/v1/notifications/read-all',
    { schema: { tags: ['notifications'], summary: 'Mark all notifications as read' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      await store.markAllNotificationsRead(requestBaseUrl(request), auth.user.id);
      return { ok: true };
    }
  );

  /**
   * PATCH /v1/notifications/:id/read
   * Mark a single notification as read. Returns 404 if not found or already read.
   */
  app.patch(
    '/v1/notifications/:id/read',
    { schema: { tags: ['notifications'], summary: 'Mark a single notification as read' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { id: string };
      const updated = await store.markNotificationRead(
        requestBaseUrl(request),
        auth.user.id,
        params.id
      );
      if (!updated) {
        return reply.code(404).send({ error: 'Notification not found or already read.' });
      }
      return { ok: true };
    }
  );

  /**
   * GET /v1/notifications/preferences
   * List all notification preferences for the current user.
   */
  app.get(
    '/v1/notifications/preferences',
    { schema: { tags: ['notifications'], summary: 'List notification preferences' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const preferences = await store.getNotificationPreferences(
        requestBaseUrl(request),
        auth.user.id
      );
      return { preferences };
    }
  );

  /**
   * PATCH /v1/notifications/preferences/:type
   * Upsert a notification preference for the given type.
   * Body: { enabled: boolean }
   */
  app.patch(
    '/v1/notifications/preferences/:type',
    { schema: { tags: ['notifications'], summary: 'Update notification preference' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { type: string };
      const body = request.body as { enabled?: unknown };
      if (typeof body.enabled !== 'boolean') {
        return reply.code(400).send({ error: '`enabled` must be a boolean.' });
      }
      const preference = await store.upsertNotificationPreference(
        requestBaseUrl(request),
        auth.user.id,
        params.type,
        body.enabled
      );
      return { preference };
    }
  );

  /**
   * GET /v1/notifications/email-address
   * Notification inbox (e.g. Gmail) used for outbound mail.
   */
  app.get(
    '/v1/notifications/email-address',
    { schema: { tags: ['notifications'], summary: 'Get notification email address' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const record = await store.getUserNotificationEmail(
        requestBaseUrl(request),
        auth.user.id
      );
      if (!record) {
        return reply.code(404).send({ error: 'User not found.' });
      }
      return record;
    }
  );

  /**
   * PATCH /v1/notifications/email-address
   * Body: { email: string | null } — null or "" clears the custom address.
   */
  app.patch(
    '/v1/notifications/email-address',
    { schema: { tags: ['notifications'], summary: 'Set notification email address' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as { email?: unknown };
      let notificationEmail: string | null = null;
      if (body.email === null || body.email === '') {
        notificationEmail = null;
      } else if (typeof body.email === 'string') {
        const normalized = normalizeNotificationEmail(body.email);
        if (!normalized) {
          return reply.code(400).send({
            error: 'Enter a valid email address (e.g. yourname@gmail.com).',
          });
        }
        notificationEmail = normalized;
      } else {
        return reply.code(400).send({ error: '`email` must be a string or null.' });
      }
      try {
        const record = await store.setUserNotificationEmail(
          requestBaseUrl(request),
          auth.user.id,
          notificationEmail
        );
        return record;
      } catch {
        return reply.code(404).send({ error: 'User not found.' });
      }
    }
  );
}
