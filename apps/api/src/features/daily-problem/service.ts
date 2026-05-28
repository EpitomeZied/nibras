import { PrismaClient } from '@prisma/client';
import { getUserToday, isConsecutiveDay } from './streak';
import { selectDailyProblem } from './selection';
import { GamificationService } from '../gamification/service';

export type DailyTodayDto = {
  paused: boolean;
  pausedUntil?: string;
  assignment?: {
    id: string;
    assignedDate: string;
    solved: boolean;
    solvedAt?: string;
    skipped: boolean;
    problem: {
      id: string;
      title: string;
      url: string;
      platform: string;
      difficulty: number;
      tags: string[];
    };
  };
  streak: {
    current: number;
    longest: number;
    totalCompleted: number;
    freezesLeft: number;
  };
};

export type DailyStatsDto = {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  freezesLeft: number;
  calendar: { date: string; status: 'solved' | 'missed' | 'skipped' | 'pending' }[];
};

export async function getOrCreateConfig(prisma: PrismaClient, userId: string) {
  return prisma.dailyProblemConfig.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getTodayAssignment(
  prisma: PrismaClient,
  userId: string
): Promise<DailyTodayDto> {
  const config = await getOrCreateConfig(prisma, userId);
  const today = getUserToday(config.timezone);
  const now = new Date();

  if (config.pausedUntil && config.pausedUntil > now) {
    return {
      paused: true,
      pausedUntil: config.pausedUntil.toISOString(),
      streak: {
        current: config.currentStreak,
        longest: config.longestStreak,
        totalCompleted: config.totalCompleted,
        freezesLeft: config.streakFreezes,
      },
    };
  }

  let assignment = await prisma.dailyProblemAssignment.findUnique({
    where: { userId_assignedDate: { userId, assignedDate: today } },
    include: { problem: true },
  });

  if (!assignment) {
    if (!config.enabled) {
      return {
        paused: false,
        streak: {
          current: config.currentStreak,
          longest: config.longestStreak,
          totalCompleted: config.totalCompleted,
          freezesLeft: config.streakFreezes,
        },
      };
    }

    const problem = await selectDailyProblem(prisma, userId, config);
    if (!problem) {
      return {
        paused: false,
        streak: {
          current: config.currentStreak,
          longest: config.longestStreak,
          totalCompleted: config.totalCompleted,
          freezesLeft: config.streakFreezes,
        },
      };
    }

    assignment = await prisma.dailyProblemAssignment.upsert({
      where: { userId_assignedDate: { userId, assignedDate: today } },
      create: {
        userId,
        problemId: problem.id,
        configId: config.id,
        assignedDate: today,
      },
      update: {},
      include: { problem: true },
    });
  }

  return {
    paused: false,
    assignment: {
      id: assignment.id,
      assignedDate: assignment.assignedDate,
      solved: assignment.solved,
      solvedAt: assignment.solvedAt?.toISOString(),
      skipped: assignment.skipped,
      problem: {
        id: assignment.problem.id,
        title: assignment.problem.title,
        url: assignment.problem.url,
        platform: assignment.problem.platform,
        difficulty: assignment.problem.difficulty,
        tags: assignment.problem.tags,
      },
    },
    streak: {
      current: config.currentStreak,
      longest: config.longestStreak,
      totalCompleted: config.totalCompleted,
      freezesLeft: config.streakFreezes,
    },
  };
}

export async function solveTodayProblem(
  prisma: PrismaClient,
  userId: string
): Promise<{ success: boolean; error?: string; streak?: DailyTodayDto['streak'] }> {
  const config = await getOrCreateConfig(prisma, userId);
  const today = getUserToday(config.timezone);

  const assignment = await prisma.dailyProblemAssignment.findUnique({
    where: { userId_assignedDate: { userId, assignedDate: today } },
  });

  if (!assignment) return { success: false, error: 'No daily problem assigned for today.' };
  if (assignment.solved) return { success: false, error: 'Already solved today.' };

  const now = new Date();

  await prisma.dailyProblemAssignment.update({
    where: { id: assignment.id },
    data: { solved: true, solvedAt: now },
  });

  await prisma.userProblemProgress.upsert({
    where: { userId_problemId: { userId, problemId: assignment.problemId } },
    create: { userId, problemId: assignment.problemId, solved: true, solvedAt: now },
    update: { solved: true, solvedAt: now },
  });

  let newStreak = config.currentStreak;
  if (config.lastCompletedDate === today) {
    // already counted
  } else if (config.lastCompletedDate && isConsecutiveDay(config.lastCompletedDate, today)) {
    newStreak = config.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(config.longestStreak, newStreak);
  const newTotal = config.totalCompleted + 1;

  await prisma.dailyProblemConfig.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      totalCompleted: newTotal,
      lastCompletedDate: today,
    },
  });

  // +10 reputation for daily solve
  await prisma.reputationEvent.upsert({
    where: { userId_source: { userId, source: `daily-solve:${assignment.id}` } },
    create: {
      userId,
      delta: 10,
      reason: 'Solved the daily problem',
      source: `daily-solve:${assignment.id}`,
      category: 'problem',
      createdAt: now,
    },
    update: {},
  });

  // Streak milestone bonuses
  const milestones: [number, number][] = [
    [7, 25],
    [30, 50],
    [100, 100],
  ];
  for (const [threshold, bonus] of milestones) {
    if (newStreak === threshold) {
      await prisma.reputationEvent.upsert({
        where: {
          userId_source: { userId, source: `daily-streak-bonus:${threshold}:${config.id}` },
        },
        create: {
          userId,
          delta: bonus,
          reason: `Reached a ${threshold}-day daily streak`,
          source: `daily-streak-bonus:${threshold}:${config.id}`,
          category: 'problem',
          createdAt: now,
        },
        update: {},
      });
    }
  }

  const gamification = new GamificationService(prisma);
  await gamification.checkAndAwardBadges(userId);

  return {
    success: true,
    streak: {
      current: newStreak,
      longest: newLongest,
      totalCompleted: newTotal,
      freezesLeft: config.streakFreezes,
    },
  };
}

export async function skipTodayProblem(
  prisma: PrismaClient,
  userId: string
): Promise<{ success: boolean; error?: string; freezesLeft?: number }> {
  const config = await getOrCreateConfig(prisma, userId);
  const today = getUserToday(config.timezone);

  const assignment = await prisma.dailyProblemAssignment.findUnique({
    where: { userId_assignedDate: { userId, assignedDate: today } },
  });

  if (!assignment) return { success: false, error: 'No daily problem assigned for today.' };
  if (assignment.solved) return { success: false, error: 'Already solved today.' };
  if (assignment.skipped) return { success: false, error: 'Already skipped today.' };
  if (config.streakFreezes <= 0)
    return { success: false, error: 'No streak freezes remaining.' };

  await prisma.dailyProblemAssignment.update({
    where: { id: assignment.id },
    data: { skipped: true },
  });

  const newFreezes = config.streakFreezes - 1;
  await prisma.dailyProblemConfig.update({
    where: { userId },
    data: {
      streakFreezes: newFreezes,
      lastCompletedDate: today,
    },
  });

  return { success: true, freezesLeft: newFreezes };
}

export async function pauseDaily(
  prisma: PrismaClient,
  userId: string,
  days: number
): Promise<{ pausedUntil: string }> {
  const clamped = Math.min(30, Math.max(1, days));
  const pausedUntil = new Date(Date.now() + clamped * 24 * 60 * 60 * 1000);

  await prisma.dailyProblemConfig.upsert({
    where: { userId },
    create: { userId, pausedUntil },
    update: { pausedUntil },
  });

  return { pausedUntil: pausedUntil.toISOString() };
}

export async function resumeDaily(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.dailyProblemConfig.upsert({
    where: { userId },
    create: { userId, pausedUntil: null },
    update: { pausedUntil: null },
  });
}

export async function getDailyHistory(
  prisma: PrismaClient,
  userId: string,
  page: number,
  limit: number
) {
  const offset = (page - 1) * limit;

  const [assignments, total] = await Promise.all([
    prisma.dailyProblemAssignment.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { assignedDate: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.dailyProblemAssignment.count({ where: { userId } }),
  ]);

  return {
    items: assignments.map((a) => ({
      id: a.id,
      assignedDate: a.assignedDate,
      solved: a.solved,
      solvedAt: a.solvedAt?.toISOString(),
      skipped: a.skipped,
      missedAt: a.missedAt?.toISOString(),
      problem: {
        id: a.problem.id,
        title: a.problem.title,
        url: a.problem.url,
        platform: a.problem.platform,
        difficulty: a.problem.difficulty,
        tags: a.problem.tags,
      },
    })),
    total,
    page,
    limit,
  };
}

export async function getDailyStats(
  prisma: PrismaClient,
  userId: string
): Promise<DailyStatsDto> {
  const config = await getOrCreateConfig(prisma, userId);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const sinceDate = ninetyDaysAgo.toISOString().slice(0, 10);

  const assignments = await prisma.dailyProblemAssignment.findMany({
    where: { userId, assignedDate: { gte: sinceDate } },
    select: { assignedDate: true, solved: true, skipped: true, missedAt: true },
    orderBy: { assignedDate: 'asc' },
  });

  const calendar = assignments.map((a) => {
    let status: 'solved' | 'missed' | 'skipped' | 'pending';
    if (a.solved) status = 'solved';
    else if (a.skipped) status = 'skipped';
    else if (a.missedAt) status = 'missed';
    else status = 'pending';
    return { date: a.assignedDate, status };
  });

  return {
    currentStreak: config.currentStreak,
    longestStreak: config.longestStreak,
    totalCompleted: config.totalCompleted,
    freezesLeft: config.streakFreezes,
    calendar,
  };
}
