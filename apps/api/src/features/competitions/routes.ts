import { FastifyInstance } from 'fastify';
import { PrismaClient, CompPlatform } from '@prisma/client';
import { requireUser, optionalUser } from '../../lib/auth';
import { AppStore } from '../../store';
import { enqueueCompetitionsJob } from '../../lib/competitions-queue';

export function registerCompetitionsRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  // ── Contests ────────────────────────────────────────────────────────────

  app.get(
    '/v1/contests',
    { schema: { tags: ['competitions'], summary: 'List contests' } },
    async (request, reply) => {
      const user = await optionalUser(request, reply, store);
      const query = request.query as {
        upcoming?: string;
        host?: string;
        from?: string;
        to?: string;
        page?: string;
        limit?: string;
      };

      const where: Record<string, unknown> = {};
      if (query.upcoming === 'true') {
        where.startsAt = { gte: new Date() };
      }
      if (query.host) {
        where.platform = query.host;
      }
      if (query.from || query.to) {
        where.startsAt = {
          ...(typeof where.startsAt === 'object'
            ? (where.startsAt as Record<string, unknown>)
            : {}),
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        };
      }

      const page = Math.max(1, parseInt(query.page ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '50', 10)));

      const [contests, total] = await Promise.all([
        prisma.contest.findMany({
          where,
          orderBy: { startsAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.contest.count({ where }),
      ]);

      let bookmarkedIds = new Set<string>();
      let reminderIds = new Set<string>();
      if (user) {
        const contestIds = contests.map((c) => c.id);
        const [bookmarks, reminders] = await Promise.all([
          prisma.contestBookmark.findMany({
            where: { userId: user.id, contestId: { in: contestIds } },
          }),
          prisma.contestReminder.findMany({
            where: { userId: user.id, contestId: { in: contestIds } },
          }),
        ]);
        bookmarkedIds = new Set(bookmarks.map((b) => b.contestId));
        reminderIds = new Set(reminders.map((r) => r.contestId));
      }

      void reply.header('x-total-count', String(total));
      return contests.map((c) => ({
        id: c.id,
        name: c.name,
        host: c.platform,
        startsAt: c.startsAt.toISOString(),
        endsAt: c.endsAt.toISOString(),
        durationMinutes: c.durationMinutes,
        url: c.url,
        phase: c.phase,
        tags: c.tags,
        bookmarked: bookmarkedIds.has(c.id),
        reminderSet: reminderIds.has(c.id),
      }));
    }
  );

  app.get(
    '/v1/contests/calendar',
    { schema: { tags: ['competitions'], summary: 'Get contests for calendar view' } },
    async (request, reply) => {
      const user = await optionalUser(request, reply, store);
      const query = request.query as { month?: string; year?: string };
      const now = new Date();
      const month = parseInt(query.month ?? String(now.getMonth() + 1), 10);
      const year = parseInt(query.year ?? String(now.getFullYear()), 10);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      const startDay = startOfMonth.getDay();
      const calendarStart = new Date(startOfMonth);
      calendarStart.setDate(calendarStart.getDate() - startDay);
      const calendarEnd = new Date(endOfMonth);
      const remaining = 6 - endOfMonth.getDay();
      calendarEnd.setDate(calendarEnd.getDate() + remaining);

      const contests = await prisma.contest.findMany({
        where: {
          startsAt: { gte: calendarStart, lte: calendarEnd },
        },
        orderBy: { startsAt: 'asc' },
      });

      let bookmarkedIds = new Set<string>();
      let reminderIds = new Set<string>();
      if (user) {
        const contestIds = contests.map((c) => c.id);
        if (contestIds.length > 0) {
          const [bookmarks, reminders] = await Promise.all([
            prisma.contestBookmark.findMany({
              where: { userId: user.id, contestId: { in: contestIds } },
            }),
            prisma.contestReminder.findMany({
              where: { userId: user.id, contestId: { in: contestIds } },
            }),
          ]);
          bookmarkedIds = new Set(bookmarks.map((b) => b.contestId));
          reminderIds = new Set(reminders.map((r) => r.contestId));
        }
      }

      const days: Record<string, Array<Record<string, unknown>>> = {};
      for (const c of contests) {
        const dateKey = c.startsAt.toISOString().slice(0, 10);
        if (!days[dateKey]) days[dateKey] = [];
        days[dateKey].push({
          id: c.id,
          name: c.name,
          host: c.platform,
          startsAt: c.startsAt.toISOString(),
          endsAt: c.endsAt.toISOString(),
          durationMinutes: c.durationMinutes,
          url: c.url,
          phase: c.phase,
          bookmarked: bookmarkedIds.has(c.id),
          reminderSet: reminderIds.has(c.id),
        });
      }

      return {
        month,
        year,
        calendarStart: calendarStart.toISOString(),
        calendarEnd: calendarEnd.toISOString(),
        days,
      };
    }
  );

  // ── Contest actions ──────────────────────────────────────────────────────

  app.post(
    '/v1/user-contests/:contestId/reminder',
    { schema: { tags: ['competitions'], summary: 'Set contest reminder' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { contestId } = request.params as { contestId: string };
      const { on, minutesBefore } =
        (request.body as { on?: boolean; minutesBefore?: number }) ?? {};

      if (on === false) {
        await prisma.contestReminder.deleteMany({
          where: { userId: auth.user.id, contestId },
        });
        return { reminderSet: false };
      }

      await prisma.contestReminder.upsert({
        where: { userId_contestId: { userId: auth.user.id, contestId } },
        create: { userId: auth.user.id, contestId, minutesBefore: minutesBefore ?? 30 },
        update: { minutesBefore: minutesBefore ?? 30, notified: false },
      });
      return { reminderSet: true };
    }
  );

  app.post(
    '/v1/user-contests/:contestId/bookmark',
    { schema: { tags: ['competitions'], summary: 'Bookmark contest' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { contestId } = request.params as { contestId: string };
      const { on } = (request.body as { on?: boolean }) ?? {};

      if (on === false) {
        await prisma.contestBookmark.deleteMany({
          where: { userId: auth.user.id, contestId },
        });
        return { bookmarked: false };
      }

      await prisma.contestBookmark.upsert({
        where: { userId_contestId: { userId: auth.user.id, contestId } },
        create: { userId: auth.user.id, contestId },
        update: {},
      });
      return { bookmarked: true };
    }
  );

  // ── Problems ────────────────────────────────────────────────────────────

  app.get(
    '/v1/problems',
    { schema: { tags: ['competitions'], summary: 'List practice problems' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const query = request.query as {
        tag?: string;
        difficultyMin?: string;
        difficultyMax?: string;
        host?: string;
        q?: string;
        page?: string;
        limit?: string;
        solved?: string;
      };

      const where: Record<string, unknown> = {};
      if (query.host) where.platform = query.host;
      if (query.tag) where.tags = { has: query.tag };
      if (query.q) where.title = { contains: query.q, mode: 'insensitive' };

      const diffFilter: Record<string, number> = {};
      if (query.difficultyMin) diffFilter.gte = parseInt(query.difficultyMin, 10);
      if (query.difficultyMax) diffFilter.lte = parseInt(query.difficultyMax, 10);
      if (Object.keys(diffFilter).length > 0) where.difficulty = diffFilter;

      const page = Math.max(1, parseInt(query.page ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '50', 10)));

      const [problems, total] = await Promise.all([
        prisma.problem.findMany({
          where,
          orderBy: { difficulty: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.problem.count({ where }),
      ]);

      const problemIds = problems.map((p) => p.id);
      const [progress, bookmarks] = await Promise.all([
        prisma.userProblemProgress.findMany({
          where: { userId: auth.user.id, problemId: { in: problemIds } },
        }),
        prisma.problemBookmark.findMany({
          where: { userId: auth.user.id, problemId: { in: problemIds } },
        }),
      ]);

      const solvedSet = new Set(progress.filter((p) => p.solved).map((p) => p.problemId));
      const bookmarkedSet = new Set(bookmarks.map((b) => b.problemId));

      let items = problems.map((p) => ({
        id: p.id,
        title: p.title,
        host: p.platform,
        difficulty: p.difficulty,
        tags: p.tags,
        url: p.url,
        solved: solvedSet.has(p.id),
        bookmarked: bookmarkedSet.has(p.id),
      }));

      if (query.solved === 'true') items = items.filter((i) => i.solved);
      if (query.solved === 'false') items = items.filter((i) => !i.solved);

      return { items, total };
    }
  );

  app.post(
    '/v1/problems/:problemId/bookmark',
    { schema: { tags: ['competitions'], summary: 'Bookmark problem' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { problemId } = request.params as { problemId: string };
      const { on } = (request.body as { on?: boolean }) ?? {};

      if (on === false) {
        await prisma.problemBookmark.deleteMany({
          where: { userId: auth.user.id, problemId },
        });
        return { bookmarked: false };
      }

      await prisma.problemBookmark.upsert({
        where: { userId_problemId: { userId: auth.user.id, problemId } },
        create: { userId: auth.user.id, problemId },
        update: {},
      });
      return { bookmarked: true };
    }
  );

  // ── Ranking ─────────────────────────────────────────────────────────────

  app.get(
    '/v1/ranking',
    { schema: { tags: ['competitions'], summary: 'Get ranking' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const query = request.query as {
        host?: string;
        scope?: string;
        page?: string;
        limit?: string;
      };

      const scope = query.scope ?? 'global';
      const platform = query.host ?? 'all';
      const page = Math.max(1, parseInt(query.page ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '50', 10)));

      const rankings = await prisma.cachedRanking.findMany({
        where: { scope, platform },
        orderBy: { rank: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, username: true } } },
      });

      return rankings.map((r) => ({
        rank: r.rank,
        userId: r.userId,
        username: r.user.username,
        rating: r.rating,
        delta: r.delta,
        contestsLast30d: r.contestsLast30d,
      }));
    }
  );

  app.get(
    '/v1/ranking/me',
    { schema: { tags: ['competitions'], summary: 'Get my ranking position' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;

      const rankings = await prisma.cachedRanking.findMany({
        where: { userId: auth.user.id },
      });

      return rankings.map((r) => ({
        scope: r.scope,
        platform: r.platform,
        rank: r.rank,
        rating: r.rating,
        delta: r.delta,
        contestsLast30d: r.contestsLast30d,
      }));
    }
  );

  // ── History ─────────────────────────────────────────────────────────────

  app.get(
    '/v1/user-contests/history',
    { schema: { tags: ['competitions'], summary: 'Get my contest history' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const query = request.query as { host?: string };

      const where: Record<string, unknown> = { userId: auth.user.id };
      if (query.host) where.platform = query.host;

      const participations = await prisma.userContestParticipation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { contest: { select: { name: true, startsAt: true } } },
        take: 100,
      });

      return participations.map((p) => ({
        contestId: p.contestId,
        name: p.contest.name,
        startedAt: p.contest.startsAt.toISOString(),
        rank: p.rank ?? 0,
        participants: p.participants ?? 0,
        delta: p.delta ?? 0,
        ratingAfter: p.ratingAfter ?? 0,
      }));
    }
  );

  // ── Linked accounts ─────────────────────────────────────────────────────

  app.get(
    '/v1/contests/accounts',
    { schema: { tags: ['competitions'], summary: 'Get linked accounts' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;

      const accounts = await prisma.linkedAccount.findMany({
        where: { userId: auth.user.id },
        orderBy: { createdAt: 'asc' },
      });

      return accounts.map((a) => ({
        host: a.platform,
        handle: a.handle,
        verified: a.verificationStatus === 'verified',
        verificationStatus: a.verificationStatus,
        rating: a.platformRating,
        maxRating: a.platformMaxRating,
        lastSyncAt: a.lastSyncAt?.toISOString() ?? null,
        linkedAt: a.createdAt.toISOString(),
      }));
    }
  );

  app.post(
    '/v1/contests/accounts/link',
    { schema: { tags: ['competitions'], summary: 'Link external account' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as { platform?: string; handle?: string };

      if (!body.platform || !body.handle) {
        return reply.status(400).send({ error: 'platform and handle are required' });
      }

      const platform = body.platform as CompPlatform;
      const handle = body.handle.trim();

      const account = await prisma.linkedAccount.upsert({
        where: { userId_platform: { userId: auth.user.id, platform } },
        create: { userId: auth.user.id, platform, handle },
        update: { handle, verificationStatus: 'pending', verifiedAt: null },
      });

      await enqueueCompetitionsJob({
        type: 'account-verify',
        userId: auth.user.id,
        platform,
        handle,
      });

      return {
        host: account.platform,
        handle: account.handle,
        verified: false,
        linkedAt: account.createdAt.toISOString(),
      };
    }
  );

  app.delete(
    '/v1/contests/accounts/:host',
    { schema: { tags: ['competitions'], summary: 'Unlink external account' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { host } = request.params as { host: string };

      await prisma.linkedAccount.deleteMany({
        where: { userId: auth.user.id, platform: host as CompPlatform },
      });

      return { unlinked: true };
    }
  );

  app.post(
    '/v1/contests/accounts/:host/resync',
    { schema: { tags: ['competitions'], summary: 'Manually resync linked account' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { host } = request.params as { host: string };

      const account = await prisma.linkedAccount.findUnique({
        where: { userId_platform: { userId: auth.user.id, platform: host as CompPlatform } },
      });

      if (!account) {
        return reply.status(404).send({ error: 'Account not found' });
      }

      await enqueueCompetitionsJob({
        type: 'account-verify',
        userId: auth.user.id,
        platform: host,
        handle: account.handle,
      });

      return { syncing: true };
    }
  );
}
