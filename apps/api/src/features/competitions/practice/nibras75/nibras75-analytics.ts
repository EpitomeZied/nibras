import { PrismaClient } from '@prisma/client';
import { fetchPracticeLcAnalytics } from '../leetcode/leetcode-client';
import type { LcAnalyticsPayload } from '../leetcode/types';
import { fetchNibras75Stats, type Nibras75DifficultyBreakdown } from './nibras75-stats';

export type Nibras75ScopedAnalytics = {
  solvedInSet: number;
  totalInSet: number;
  byDifficulty: Nibras75DifficultyBreakdown;
};

export type Nibras75AnalyticsPayload = LcAnalyticsPayload & {
  nibras75: Nibras75ScopedAnalytics;
};

export async function fetchNibras75Analytics(
  handle: string,
  userId: string | undefined,
  prisma: PrismaClient
): Promise<Nibras75AnalyticsPayload> {
  const [base, stats] = await Promise.all([
    fetchPracticeLcAnalytics(handle),
    fetchNibras75Stats(handle, userId, prisma),
  ]);

  return {
    ...base,
    nibras75: {
      solvedInSet: stats.completedInSet,
      totalInSet: stats.curriculumTotal,
      byDifficulty: stats.byDifficulty,
    },
  };
}

export async function getNibras75Config(prisma: PrismaClient, userId: string) {
  return prisma.nibras75Config.findUnique({ where: { userId } });
}

export async function upsertNibras75Config(
  prisma: PrismaClient,
  userId: string,
  data: { weeklyPace?: number; targetDate?: string | null; useForDailyProblem?: boolean }
) {
  const weeklyPace =
    typeof data.weeklyPace === 'number'
      ? Math.min(75, Math.max(1, Math.round(data.weeklyPace)))
      : undefined;
  const targetDate =
    data.targetDate === null ? null : data.targetDate ? new Date(data.targetDate) : undefined;

  return prisma.nibras75Config.upsert({
    where: { userId },
    create: {
      userId,
      weeklyPace: weeklyPace ?? 5,
      targetDate: targetDate ?? null,
      useForDailyProblem: data.useForDailyProblem ?? false,
    },
    update: {
      ...(weeklyPace !== undefined ? { weeklyPace } : {}),
      ...(targetDate !== undefined ? { targetDate } : {}),
      ...(data.useForDailyProblem !== undefined
        ? { useForDailyProblem: data.useForDailyProblem }
        : {}),
    },
  });
}
