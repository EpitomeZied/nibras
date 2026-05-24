import { PrismaClient, ReputationCategory, SubmissionStatus } from '@prisma/client';
import { computeLevel } from '../gamification/badges-catalog';

export type ReputationEventDto = {
  id: string;
  delta: number;
  reason: string;
  source?: string;
  createdAt: string;
};

export type MyReputationDto = {
  total: number;
  weeklyDelta: number;
  monthlyDelta: number;
  rank: number | null;
  percentile: number | null;
  history: ReputationEventDto[];
};

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setUTCDate(copy.getUTCDate() - diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export class ReputationService {
  constructor(private readonly prisma: PrismaClient) {}

  async syncReputationFromActivity(userId: string): Promise<void> {
    const events: Array<{
      delta: number;
      reason: string;
      source: string;
      category: ReputationCategory;
      createdAt?: Date;
    }> = [];

    const passedSubmissions = await this.prisma.submissionAttempt.findMany({
      where: { userId, status: SubmissionStatus.passed },
      select: { id: true, submittedAt: true, createdAt: true },
    });
    for (const sub of passedSubmissions) {
      events.push({
        delta: 10,
        reason: 'Passed project submission',
        source: `submission:${sub.id}`,
        category: 'course',
        createdAt: sub.submittedAt ?? sub.createdAt,
      });
    }

    const acceptedAnswers = await this.prisma.communityAnswer.findMany({
      where: { authorId: userId, accepted: true },
      select: { id: true, createdAt: true },
    });
    for (const answer of acceptedAnswers) {
      events.push({
        delta: 15,
        reason: 'Answer accepted by question author',
        source: `answer-accepted:${answer.id}`,
        category: 'community',
        createdAt: answer.createdAt,
      });
    }

    const questions = await this.prisma.communityQuestion.findMany({
      where: { authorId: userId, votesCount: { gt: 0 } },
      select: { id: true, votesCount: true, createdAt: true },
    });
    for (const q of questions) {
      events.push({
        delta: q.votesCount * 3,
        reason: `Question upvotes (${q.votesCount})`,
        source: `question-upvotes:${q.id}`,
        category: 'community',
        createdAt: q.createdAt,
      });
    }

    const solvedProblems = await this.prisma.userProblemProgress.findMany({
      where: { userId, solved: true },
      select: { problemId: true, solvedAt: true, createdAt: true },
    });
    for (const p of solvedProblems) {
      events.push({
        delta: 5,
        reason: 'Solved practice problem',
        source: `problem:${p.problemId}`,
        category: 'problem',
        createdAt: p.solvedAt ?? p.createdAt,
      });
    }

    const contestParticipations = await this.prisma.userContestParticipation.findMany({
      where: { userId },
      select: { contestId: true, createdAt: true },
    });
    for (const c of contestParticipations) {
      events.push({
        delta: 5,
        reason: 'Contest participation',
        source: `contest:${c.contestId}`,
        category: 'contest',
        createdAt: c.createdAt,
      });
    }

    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });
    for (const ub of userBadges) {
      if (ub.badge.points > 0) {
        events.push({
          delta: ub.badge.points,
          reason: `Earned badge: ${ub.badge.name}`,
          source: `badge:${ub.badge.code}`,
          category: 'badge',
          createdAt: ub.earnedAt,
        });
      }
    }

    for (const event of events) {
      await this.prisma.reputationEvent.upsert({
        where: { userId_source: { userId, source: event.source } },
        create: {
          userId,
          delta: event.delta,
          reason: event.reason,
          source: event.source,
          category: event.category,
          createdAt: event.createdAt ?? new Date(),
        },
        update: {},
      });
    }
  }

  async getMyReputation(userId: string): Promise<MyReputationDto> {
    await this.syncReputationFromActivity(userId);

    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    const [historyEvents, allTotals, weekEvents, monthEvents, totalAgg] = await Promise.all([
      this.prisma.reputationEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.reputationEvent.groupBy({
        by: ['userId'],
        _sum: { delta: true },
      }),
      this.prisma.reputationEvent.aggregate({
        where: { userId, createdAt: { gte: weekStart } },
        _sum: { delta: true },
      }),
      this.prisma.reputationEvent.aggregate({
        where: { userId, createdAt: { gte: monthStart } },
        _sum: { delta: true },
      }),
      this.prisma.reputationEvent.aggregate({
        where: { userId },
        _sum: { delta: true },
      }),
    ]);

    const fullTotal = totalAgg._sum.delta ?? 0;
    const weeklyDelta = weekEvents._sum.delta ?? 0;
    const monthlyDelta = monthEvents._sum.delta ?? 0;

    const sortedTotals = allTotals
      .map((row) => ({ userId: row.userId, total: row._sum.delta ?? 0 }))
      .sort((a, b) => b.total - a.total);

    const rankIndex = sortedTotals.findIndex((row) => row.userId === userId);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    const percentile =
      sortedTotals.length > 0 && rank !== null
        ? Math.round(((sortedTotals.length - rank) / sortedTotals.length) * 100)
        : null;

    return {
      total: fullTotal,
      weeklyDelta,
      monthlyDelta,
      rank,
      percentile,
      history: historyEvents.map((e) => ({
        id: e.id,
        delta: e.delta,
        reason: e.reason,
        source: e.source,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  async getUserTotalScore(userId: string): Promise<number> {
    const agg = await this.prisma.reputationEvent.aggregate({
      where: { userId },
      _sum: { delta: true },
    });
    return agg._sum.delta ?? 0;
  }

  getLevelForScore(score: number): number {
    return computeLevel(score);
  }
}
