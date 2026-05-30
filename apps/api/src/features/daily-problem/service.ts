import { PrismaClient } from '@prisma/client';
import type { DailyMilestone } from '@nibras/contracts';
import { getUserToday, isConsecutiveDay } from '@nibras/daily-problem';
import { selectDailyProblem } from './selection';
import { GamificationService } from '../gamification/service';
import { getUserCfData } from '../competitions/practice/codeforces/cf-api';

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
  calendar: { date: string; status: 'solved' | 'missed' | 'skipped' | 'pending' | 'none' }[];
  nextMilestone: DailyMilestone | null;
};

const STREAK_MILESTONES: Array<[number, number]> = [
  [7, 25],
  [14, 0],
  [30, 50],
  [100, 100],
];

const COMPLETED_MILESTONES = [25, 100];

function computeNextMilestone(
  currentStreak: number,
  totalCompleted: number
): DailyMilestone | null {
  const streakTargets = [7, 14, 30, 100];
  for (const target of streakTargets) {
    if (currentStreak < target) {
      const bonus = STREAK_MILESTONES.find(([t]) => t === target)?.[1];
      return {
        kind: 'streak',
        target,
        current: currentStreak,
        remaining: target - currentStreak,
        label: `${target}-day streak`,
        reputationBonus: bonus && bonus > 0 ? bonus : undefined,
      };
    }
  }
  for (const target of COMPLETED_MILESTONES) {
    if (totalCompleted < target) {
      return {
        kind: 'completed',
        target,
        current: totalCompleted,
        remaining: target - totalCompleted,
        label: `${target} daily problems completed`,
      };
    }
  }
  return null;
}

function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function fillCalendarWindow(
  timezone: string,
  assignments: Array<{
    assignedDate: string;
    solved: boolean;
    skipped: boolean;
    missedAt: Date | null;
  }>
): DailyStatsDto['calendar'] {
  const byDate = new Map(
    assignments.map((a) => {
      let status: DailyStatsDto['calendar'][number]['status'];
      if (a.solved) status = 'solved';
      else if (a.skipped) status = 'skipped';
      else if (a.missedAt) status = 'missed';
      else status = 'pending';
      return [a.assignedDate, status] as const;
    })
  );

  const today = getUserToday(timezone);
  const calendar: DailyStatsDto['calendar'] = [];
  for (let offset = -89; offset <= 0; offset++) {
    const date = addDaysToDateString(today, offset);
    calendar.push({ date, status: byDate.get(date) ?? 'none' });
  }
  return calendar;
}

async function applySolveRewards(
  prisma: PrismaClient,
  userId: string,
  assignmentId: string,
  configId: string,
  newStreak: number,
  now: Date
): Promise<{ reputationEarned: number; milestoneBonus: number; newBadges: string[] }> {
  let reputationEarned = 10;
  let milestoneBonus = 0;

  await prisma.reputationEvent.upsert({
    where: { userId_source: { userId, source: `daily-solve:${assignmentId}` } },
    create: {
      userId,
      delta: 10,
      reason: 'Solved the daily problem',
      source: `daily-solve:${assignmentId}`,
      category: 'problem',
      createdAt: now,
    },
    update: {},
  });

  for (const [threshold, bonus] of STREAK_MILESTONES) {
    if (newStreak === threshold && bonus > 0) {
      milestoneBonus += bonus;
      await prisma.reputationEvent.upsert({
        where: {
          userId_source: { userId, source: `daily-streak-bonus:${threshold}:${configId}` },
        },
        create: {
          userId,
          delta: bonus,
          reason: `Reached a ${threshold}-day daily streak`,
          source: `daily-streak-bonus:${threshold}:${configId}`,
          category: 'problem',
          createdAt: now,
        },
        update: {},
      });
    }
  }

  reputationEarned += milestoneBonus;

  const gamification = new GamificationService(prisma);
  const newBadges = (await gamification.checkAndAwardBadges(userId)).map((b) => b.name);

  return { reputationEarned, milestoneBonus, newBadges };
}

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

export async function getTodayProblemContext(prisma: PrismaClient, userId: string) {
  const today = await getTodayAssignment(prisma, userId);
  if (!today.assignment) return null;
  const { problem } = today.assignment;
  return {
    id: problem.id,
    title: problem.title,
    url: problem.url,
    platform: problem.platform,
    difficulty: problem.difficulty,
    tags: problem.tags,
    description: `Solve "${problem.title}" on ${problem.platform}. Open the external link for the full problem statement.`,
  };
}

export async function solveTodayProblem(
  prisma: PrismaClient,
  userId: string
): Promise<{
  success: boolean;
  error?: string;
  streak?: DailyTodayDto['streak'];
  reputationEarned?: number;
  milestoneBonus?: number;
  newBadges?: string[];
}> {
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

  const rewards = await applySolveRewards(prisma, userId, assignment.id, config.id, newStreak, now);

  return {
    success: true,
    streak: {
      current: newStreak,
      longest: newLongest,
      totalCompleted: newTotal,
      freezesLeft: config.streakFreezes,
    },
    ...rewards,
  };
}

export async function verifyTodayProblemOnPlatform(
  prisma: PrismaClient,
  userId: string
): Promise<{
  verified: boolean;
  error?: string;
  streak?: DailyTodayDto['streak'];
  reputationEarned?: number;
  milestoneBonus?: number;
  newBadges?: string[];
}> {
  const config = await getOrCreateConfig(prisma, userId);
  const today = getUserToday(config.timezone);

  const assignment = await prisma.dailyProblemAssignment.findUnique({
    where: { userId_assignedDate: { userId, assignedDate: today } },
    include: { problem: true },
  });

  if (!assignment) return { verified: false, error: 'No daily problem assigned for today.' };
  if (assignment.solved) return { verified: false, error: 'Already solved today.' };

  const problem = assignment.problem;
  if (problem.platform !== 'codeforces') {
    return {
      verified: false,
      error: 'Platform verification is only supported for Codeforces problems right now.',
    };
  }

  const linked = await prisma.linkedAccount.findUnique({
    where: { userId_platform: { userId, platform: 'codeforces' } },
  });

  if (!linked || linked.verificationStatus !== 'verified') {
    return {
      verified: false,
      error: 'Link and verify your Codeforces account under Competitions first.',
    };
  }

  const { statusMap } = await getUserCfData(linked.handle);
  const solved = statusMap.get(problem.platformProblemId)?.solved ?? false;

  if (!solved) {
    return {
      verified: false,
      error: `No accepted submission found for this problem on Codeforces (@${linked.handle}).`,
    };
  }

  const result = await solveTodayProblem(prisma, userId);
  if (!result.success) {
    return { verified: false, error: result.error ?? 'Could not mark problem as solved.' };
  }

  return {
    verified: true,
    streak: result.streak,
    reputationEarned: result.reputationEarned,
    milestoneBonus: result.milestoneBonus,
    newBadges: result.newBadges,
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
  if (config.streakFreezes <= 0) return { success: false, error: 'No streak freezes remaining.' };

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

export async function getDailyStats(prisma: PrismaClient, userId: string): Promise<DailyStatsDto> {
  const config = await getOrCreateConfig(prisma, userId);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const sinceDate = ninetyDaysAgo.toISOString().slice(0, 10);

  const assignments = await prisma.dailyProblemAssignment.findMany({
    where: { userId, assignedDate: { gte: sinceDate } },
    select: { assignedDate: true, solved: true, skipped: true, missedAt: true },
    orderBy: { assignedDate: 'asc' },
  });

  const calendar = fillCalendarWindow(config.timezone, assignments);

  return {
    currentStreak: config.currentStreak,
    longestStreak: config.longestStreak,
    totalCompleted: config.totalCompleted,
    freezesLeft: config.streakFreezes,
    calendar,
    nextMilestone: computeNextMilestone(config.currentStreak, config.totalCompleted),
  };
}

export async function getDailyTags(prisma: PrismaClient): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ tag: string }>>`
    SELECT DISTINCT unnest(tags) AS tag FROM "Problem" ORDER BY tag ASC LIMIT 200
  `;
  return rows.map((r) => r.tag).filter(Boolean);
}

export async function getDailyLeaderboard(
  prisma: PrismaClient,
  limit: number = 50
): Promise<
  Array<{
    rank: number;
    userId: string;
    username: string;
    currentStreak: number;
    longestStreak: number;
    totalCompleted: number;
  }>
> {
  const configs = await prisma.dailyProblemConfig.findMany({
    where: { enabled: true },
    orderBy: [{ currentStreak: 'desc' }, { longestStreak: 'desc' }, { totalCompleted: 'desc' }],
    take: limit,
    include: { user: { select: { id: true, username: true } } },
  });

  return configs.map((c, i) => ({
    rank: i + 1,
    userId: c.user.id,
    username: c.user.username,
    currentStreak: c.currentStreak,
    longestStreak: c.longestStreak,
    totalCompleted: c.totalCompleted,
  }));
}
