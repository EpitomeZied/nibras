import { PrismaClient, SubmissionStatus } from '@prisma/client';
import { BADGE_CATALOG, computeLevel } from './badges-catalog';
import { ReputationService } from '../reputation/service';

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

type UserMetrics = {
  githubLinked: boolean;
  passedSubmissions: number;
  questions: number;
  answers: number;
  acceptedAnswers: number;
  solvedProblems: number;
  contestParticipations: number;
  earnedBadges: number;
};

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
  switch (code) {
    case 'github-connected':
      return metrics.githubLinked ? 1 : 0;
    case 'first-steps':
      return metrics.passedSubmissions;
    case 'ship-it':
      return metrics.passedSubmissions;
    case 'project-veteran':
      return metrics.passedSubmissions;
    case 'curious-mind':
      return metrics.questions;
    case 'helpful-peer':
      return metrics.answers;
    case 'accepted-answer':
      return metrics.acceptedAnswers;
    case 'problem-solver-1':
    case 'problem-solver-10':
    case 'problem-solver-50':
      return metrics.solvedProblems;
    case 'contest-debut':
      return metrics.contestParticipations;
    case 'badge-collector':
      return metrics.earnedBadges;
    default:
      return 0;
  }
}

function isBadgeEarned(code: string, metrics: UserMetrics, threshold: number): boolean {
  return progressForBadge(code, metrics) >= threshold;
}

export class GamificationService {
  private readonly reputation: ReputationService;

  constructor(private readonly prisma: PrismaClient) {
    this.reputation = new ReputationService(prisma);
  }

  async ensureBadgeCatalog(): Promise<void> {
    for (const badge of BADGE_CATALOG) {
      await this.prisma.badgeDefinition.upsert({
        where: { code: badge.code },
        create: badge,
        update: {
          name: badge.name,
          description: badge.description,
          rarity: badge.rarity,
          category: badge.category,
          threshold: badge.threshold,
          points: badge.points,
          sortOrder: badge.sortOrder,
        },
      });
    }
  }

  private async getMetrics(userId: string): Promise<UserMetrics> {
    const [
      user,
      passedSubmissions,
      questions,
      answers,
      acceptedAnswers,
      solvedProblems,
      contestParticipations,
      earnedBadges,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { githubLinked: true },
      }),
      this.prisma.submissionAttempt.count({
        where: { userId, status: SubmissionStatus.passed },
      }),
      this.prisma.communityQuestion.count({ where: { authorId: userId } }),
      this.prisma.communityAnswer.count({ where: { authorId: userId } }),
      this.prisma.communityAnswer.count({ where: { authorId: userId, accepted: true } }),
      this.prisma.userProblemProgress.count({ where: { userId, solved: true } }),
      this.prisma.userContestParticipation.count({ where: { userId } }),
      this.prisma.userBadge.count({ where: { userId } }),
    ]);

    return {
      githubLinked: user?.githubLinked ?? false,
      passedSubmissions,
      questions,
      answers,
      acceptedAnswers,
      solvedProblems,
      contestParticipations,
      earnedBadges,
    };
  }

  async listBadgesForUser(userId: string): Promise<BadgeDto[]> {
    await this.ensureBadgeCatalog();
    const [definitions, earned, metrics] = await Promise.all([
      this.prisma.badgeDefinition.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] }),
      this.prisma.userBadge.findMany({ where: { userId } }),
      this.getMetrics(userId),
    ]);
    const earnedByBadgeId = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));

    return definitions.map((def) => {
      const progress = progressForBadge(def.code, metrics);
      const earnedAt = earnedByBadgeId.get(def.id);
      return {
        id: def.id,
        code: def.code,
        name: def.name,
        description: def.description || undefined,
        iconUrl: def.iconUrl ?? undefined,
        rarity: def.rarity,
        earnedAt: earnedAt?.toISOString(),
        progress: earnedAt ? undefined : progress,
        threshold: def.threshold,
      };
    });
  }

  async checkAndAwardBadges(userId: string): Promise<BadgeDto[]> {
    await this.ensureBadgeCatalog();
    await this.reputation.syncReputationFromActivity(userId);

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
    });

    const userIds = grouped.map((g) => g.userId);
    const [users, badgeCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true },
      }),
      this.prisma.userBadge.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _count: { id: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u.username]));
    const badgeMap = new Map(badgeCounts.map((b) => [b.userId, b._count.id]));

    const scored = grouped
      .map((g) => ({
        userId: g.userId,
        score: g._sum.delta ?? 0,
        username: userMap.get(g.userId) ?? 'unknown',
        badges: badgeMap.get(g.userId) ?? 0,
        level: computeLevel(g._sum.delta ?? 0),
      }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score);

    const total = scored.length;
    const offset = (page - 1) * limit;
    const pageSlice = scored.slice(offset, offset + limit);

    const entries: LeaderboardEntryDto[] = pageSlice.map((row, i) => ({
      rank: offset + i + 1,
      userId: row.userId,
      username: row.username,
      score: row.score,
      badges: row.badges,
      level: row.level,
    }));

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

    const grouped = await this.prisma.reputationEvent.groupBy({
      by: ['userId'],
      where,
      _sum: { delta: true },
    });

    const scored = grouped
      .map((g) => ({ userId: g.userId, score: g._sum.delta ?? 0 }))
      .sort((a, b) => b.score - a.score);

    const myIndex = scored.findIndex((s) => s.userId === userId);
    const score = myIndex >= 0 ? scored[myIndex].score : 0;
    const badgeCount = await this.prisma.userBadge.count({ where: { userId } });

    return {
      rank: myIndex >= 0 ? myIndex + 1 : null,
      score,
      delta: 0,
      level: computeLevel(score),
      badges: badgeCount,
    };
  }
}
