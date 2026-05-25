import {
  AssignmentSubmissionStatus,
  PrismaClient,
  SubmissionStatus,
} from '@prisma/client';
import {
  BADGE_BY_CODE,
  BADGE_CATALOG,
  badgeSeedToDefinition,
  computeLevel,
  progressForMetric,
  type UserMetrics,
} from './badges-catalog';
import { ReputationService, type MyReputationDto } from '../reputation/service';

export type AchievementsDashboardDto = {
  badges: BadgeDto[];
  reputation: MyReputationDto;
  newlyAwarded: BadgeDto[];
};

export type BadgeDto = {
  id: string;
  code: string;
  name: string;
  description?: string;
  iconUrl?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
  progress?: number;
  threshold?: number;
};

export type LeaderboardEntryDto = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  delta?: number;
  badges?: number;
  level?: number;
};

export type LeaderboardFilters = {
  period?: 'all' | 'month' | 'week' | 'today';
  scope?: 'global' | 'course' | 'cohort';
  courseId?: string;
  page?: number;
  limit?: number;
};

function githubAvatarUrlForLogin(login: string | null | undefined, size = 64): string | undefined {
  const trimmed = login?.trim();
  if (!trimmed) return undefined;
  return `https://avatars.githubusercontent.com/${encodeURIComponent(trimmed)}?s=${size}`;
}

function periodStart(period: LeaderboardFilters['period']): Date | null {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case 'week': {
      const d = new Date(now);
      const day = d.getUTCDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setUTCDate(d.getUTCDate() - diff);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case 'month':
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    default:
      return null;
  }
}

function progressForBadge(code: string, metrics: UserMetrics): number {
  const badge = BADGE_BY_CODE.get(code);
  if (!badge) return 0;
  return progressForMetric(badge.metric, metrics);
}

function isBadgeEarned(code: string, metrics: UserMetrics, threshold: number): boolean {
  return progressForBadge(code, metrics) >= threshold;
}

export class GamificationService {
  private readonly reputation: ReputationService;

  constructor(private readonly prisma: PrismaClient) {
    this.reputation = new ReputationService(prisma);
  }

  async ensureBadgeCatalog(): Promise<number> {
    await this.prisma.$transaction(
      BADGE_CATALOG.map((badge) => {
        const data = badgeSeedToDefinition(badge);
        return this.prisma.badgeDefinition.upsert({
          where: { code: badge.code },
          create: data,
          update: data,
        });
      })
    );
    return this.prisma.badgeDefinition.count();
  }

  private async getMetrics(userId: string): Promise<UserMetrics> {
    const [
      user,
      passedSubmissions,
      totalSubmissions,
      failedSubmissions,
      teamMemberships,
      courseEnrollments,
      assignmentSubmissions,
      videosWatched,
      questions,
      questionUpvotesAgg,
      answers,
      acceptedAnswers,
      communityVotes,
      threads,
      threadPosts,
      solvedProblems,
      problemBookmarks,
      contestParticipations,
      contestBookmarks,
      earnedBadges,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { githubLinked: true, githubAppInstalled: true },
      }),
      this.prisma.submissionAttempt.count({
        where: { userId, status: SubmissionStatus.passed },
      }),
      this.prisma.submissionAttempt.count({ where: { userId } }),
      this.prisma.submissionAttempt.count({
        where: { userId, status: SubmissionStatus.failed },
      }),
      this.prisma.teamMember.count({ where: { userId } }),
      this.prisma.courseMembership.count({ where: { userId } }),
      this.prisma.assignmentSubmission.count({
        where: { userId, status: { not: AssignmentSubmissionStatus.draft } },
      }),
      this.prisma.videoProgress.count({ where: { userId, watched: true } }),
      this.prisma.communityQuestion.count({ where: { authorId: userId } }),
      this.prisma.communityQuestion.aggregate({
        where: { authorId: userId },
        _sum: { votesCount: true },
      }),
      this.prisma.communityAnswer.count({ where: { authorId: userId } }),
      this.prisma.communityAnswer.count({ where: { authorId: userId, accepted: true } }),
      this.prisma.communityVote.count({ where: { userId } }),
      this.prisma.communityThread.count({ where: { authorId: userId } }),
      this.prisma.communityPost.count({ where: { authorId: userId } }),
      this.prisma.userProblemProgress.count({ where: { userId, solved: true } }),
      this.prisma.problemBookmark.count({ where: { userId } }),
      this.prisma.userContestParticipation.count({ where: { userId } }),
      this.prisma.contestBookmark.count({ where: { userId } }),
      this.prisma.userBadge.count({ where: { userId } }),
    ]);

    return {
      githubLinked: user?.githubLinked ?? false,
      githubAppInstalled: user?.githubAppInstalled ?? false,
      courseEnrollments,
      passedSubmissions,
      totalSubmissions,
      failedSubmissions,
      teamMemberships,
      questions,
      answers,
      acceptedAnswers,
      questionUpvotesReceived: questionUpvotesAgg._sum.votesCount ?? 0,
      communityVotes,
      threads,
      threadPosts,
      solvedProblems,
      problemBookmarks,
      contestParticipations,
      contestBookmarks,
      assignmentSubmissions,
      videosWatched,
      earnedBadges,
    };
  }

  async listBadgesForUser(userId: string): Promise<BadgeDto[]> {
    let definitionCount = await this.ensureBadgeCatalog();
    if (definitionCount < BADGE_CATALOG.length) {
      definitionCount = await this.ensureBadgeCatalog();
    }

    const [definitions, earned, metrics] = await Promise.all([
      this.prisma.badgeDefinition.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }),
      this.prisma.userBadge.findMany({ where: { userId } }),
      this.getMetrics(userId),
    ]);
    const earnedByBadgeId = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));

    return definitions.map((def) => {
      const raw = progressForBadge(def.code, metrics);
      const capped = Math.min(raw, def.threshold);
      const earnedAt = earnedByBadgeId.get(def.id);
      return {
        id: def.id,
        code: def.code,
        name: def.name,
        description: def.description || undefined,
        iconUrl: def.iconUrl ?? undefined,
        rarity: def.rarity,
        earnedAt: earnedAt?.toISOString(),
        progress: earnedAt ? def.threshold : capped,
        threshold: def.threshold,
      };
    });
  }

  async getAchievementsDashboard(userId: string): Promise<AchievementsDashboardDto> {
    await this.ensureBadgeCatalog();
    await this.reputation.syncReputationFromActivity(userId, { force: true });
    const newlyAwarded = await this.checkAndAwardBadges(userId, { skipSync: true });
    const [badges, reputation] = await Promise.all([
      this.listBadgesForUser(userId),
      this.reputation.getMyReputation(userId, { sync: false }),
    ]);
    return { badges, reputation, newlyAwarded };
  }

  async checkAndAwardBadges(
    userId: string,
    opts?: { skipSync?: boolean }
  ): Promise<BadgeDto[]> {
    await this.ensureBadgeCatalog();
    if (!opts?.skipSync) {
      await this.reputation.syncReputationFromActivity(userId, { force: true });
    }

    const metrics = await this.getMetrics(userId);
    const definitions = await this.prisma.badgeDefinition.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    const newlyAwarded: BadgeDto[] = [];
    let changed = true;

    while (changed) {
      changed = false;
      const existing = await this.prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      });
      const existingIds = new Set(existing.map((e) => e.badgeId));
      const currentMetrics = await this.getMetrics(userId);

      for (const def of definitions) {
        if (existingIds.has(def.id)) continue;
        if (!isBadgeEarned(def.code, currentMetrics, def.threshold)) continue;

        const earned = await this.prisma.userBadge.create({
          data: { userId, badgeId: def.id },
        });

        if (def.points > 0) {
          await this.prisma.reputationEvent.upsert({
            where: { userId_source: { userId, source: `badge:${def.code}` } },
            create: {
              userId,
              delta: def.points,
              reason: `Earned badge: ${def.name}`,
              source: `badge:${def.code}`,
              category: 'badge',
              createdAt: earned.earnedAt,
            },
            update: {},
          });
        }

        newlyAwarded.push({
          id: def.id,
          code: def.code,
          name: def.name,
          description: def.description || undefined,
          iconUrl: def.iconUrl ?? undefined,
          rarity: def.rarity,
          earnedAt: earned.earnedAt.toISOString(),
        });
        changed = true;
      }
    }

    return newlyAwarded;
  }

  private async resolveScopeUserIds(
    userId: string,
    scope: LeaderboardFilters['scope'],
    courseId?: string
  ): Promise<string[] | null> {
    if (scope === 'course') {
      const memberships = await this.prisma.courseMembership.findMany({
        where: { userId },
        select: { courseId: true },
      });
      const courseIds = courseId
        ? memberships.filter((m) => m.courseId === courseId).map((m) => m.courseId)
        : memberships.map((m) => m.courseId);
      if (courseIds.length === 0) return [userId];
      const peers = await this.prisma.courseMembership.findMany({
        where: { courseId: { in: courseIds } },
        select: { userId: true },
        distinct: ['userId'],
      });
      return peers.map((p) => p.userId);
    }
    if (scope === 'cohort') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { yearLevel: true },
      });
      const peers = await this.prisma.user.findMany({
        where: { yearLevel: user?.yearLevel ?? 1 },
        select: { id: true },
      });
      return peers.map((p) => p.id);
    }
    return null;
  }

  async getLeaderboard(
    requesterId: string,
    filters: LeaderboardFilters = {}
  ): Promise<{ entries: LeaderboardEntryDto[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 25));
    const since = periodStart(filters.period ?? 'all');
    const scopeUserIds = await this.resolveScopeUserIds(
      requesterId,
      filters.scope ?? 'global',
      filters.courseId
    );

    const where: { createdAt?: { gte: Date }; userId?: { in: string[] } } = {};
    if (since) where.createdAt = { gte: since };
    if (scopeUserIds) where.userId = { in: scopeUserIds };

    const grouped = await this.prisma.reputationEvent.groupBy({
      by: ['userId'],
      where,
      _sum: { delta: true },
      orderBy: { _sum: { delta: 'desc' } },
    });

    const scored = grouped
      .map((g) => ({
        userId: g.userId,
        score: g._sum.delta ?? 0,
      }))
      .filter((e) => e.score > 0);

    const total = scored.length;
    const offset = (page - 1) * limit;
    const pageSlice = scored.slice(offset, offset + limit);
    const pageUserIds = pageSlice.map((r) => r.userId);

    const [users, badgeCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: pageUserIds } },
        select: {
          id: true,
          username: true,
          githubAccount: { select: { login: true } },
        },
      }),
      this.prisma.userBadge.groupBy({
        by: ['userId'],
        where: { userId: { in: pageUserIds } },
        _count: { id: true },
      }),
    ]);

    const userMap = new Map(
      users.map((u) => [
        u.id,
        { username: u.username, login: u.githubAccount?.login ?? null },
      ])
    );
    const badgeMap = new Map(badgeCounts.map((b) => [b.userId, b._count.id]));

    const entries: LeaderboardEntryDto[] = pageSlice.map((row, i) => {
      const user = userMap.get(row.userId);
      return {
        rank: offset + i + 1,
        userId: row.userId,
        username: user?.username ?? 'unknown',
        avatarUrl: githubAvatarUrlForLogin(user?.login),
        score: row.score,
        badges: badgeMap.get(row.userId) ?? 0,
        level: computeLevel(row.score),
      };
    });

    return { entries, total, page, limit };
  }

  async getMyLeaderboardRank(
    userId: string,
    filters: Omit<LeaderboardFilters, 'page' | 'limit'> = {}
  ): Promise<{
    rank: number | null;
    score: number;
    delta: number;
    level: number;
    badges: number;
  }> {
    const since = periodStart(filters.period ?? 'all');
    const scopeUserIds = await this.resolveScopeUserIds(
      userId,
      filters.scope ?? 'global',
      filters.courseId
    );

    const where: { createdAt?: { gte: Date }; userId?: { in: string[] } } = {};
    if (since) where.createdAt = { gte: since };
    if (scopeUserIds) where.userId = { in: scopeUserIds };

    const [myAgg, grouped, badgeCount] = await Promise.all([
      this.prisma.reputationEvent.aggregate({
        where: { ...where, userId },
        _sum: { delta: true },
      }),
      this.prisma.reputationEvent.groupBy({
        by: ['userId'],
        where,
        _sum: { delta: true },
        orderBy: { _sum: { delta: 'desc' } },
      }),
      this.prisma.userBadge.count({ where: { userId } }),
    ]);

    const score = myAgg._sum.delta ?? 0;
    const scored = grouped
      .map((g) => ({ userId: g.userId, total: g._sum.delta ?? 0 }))
      .filter((g) => g.total > 0);
    const myIndex = scored.findIndex((s) => s.userId === userId);

    return {
      rank: myIndex >= 0 ? myIndex + 1 : null,
      score,
      delta: 0,
      level: computeLevel(score),
      badges: badgeCount,
    };
  }
}
