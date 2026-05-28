import { PrismaClient } from '@prisma/client';

function getDateInTimezone(timezone: string, offsetDays: number = 0): string {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const y = parts.find((p) => p.type === 'year')!.value;
    const m = parts.find((p) => p.type === 'month')!.value;
    const dd = parts.find((p) => p.type === 'day')!.value;
    return `${y}-${m}-${dd}`;
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function getNowInTimezone(timezone: string): Date {
  return new Date();
}

async function selectRandomProblem(
  prisma: PrismaClient,
  userId: string,
  config: { difficultyPref: number[]; tagPrefs: string[] }
): Promise<{ id: string; title: string; difficulty: number } | null> {
  const assignedIds = (
    await prisma.dailyProblemAssignment.findMany({
      where: { userId },
      select: { problemId: true },
    })
  ).map((a) => a.problemId);

  const solvedIds = (
    await prisma.userProblemProgress.findMany({
      where: { userId, solved: true },
      select: { problemId: true },
    })
  ).map((p) => p.problemId);

  const excludeIds = [...new Set([...assignedIds, ...solvedIds])];

  const where: {
    id?: { notIn: string[] };
    difficulty?: { in: number[] };
    tags?: { hasSome: string[] };
  } = {};
  if (excludeIds.length > 0) where.id = { notIn: excludeIds };
  if (config.difficultyPref.length > 0) where.difficulty = { in: config.difficultyPref };
  if (config.tagPrefs.length > 0) where.tags = { hasSome: config.tagPrefs };

  let count = await prisma.problem.count({ where });
  if (count > 0) {
    const skip = Math.floor(Math.random() * count);
    const [p] = await prisma.problem.findMany({
      where,
      take: 1,
      skip,
      select: { id: true, title: true, difficulty: true },
    });
    if (p) return p;
  }

  // Fallback: drop prefs
  const fallbackWhere: { id?: { notIn: string[] } } = {};
  if (excludeIds.length > 0) fallbackWhere.id = { notIn: excludeIds };
  count = await prisma.problem.count({ where: fallbackWhere });
  if (count > 0) {
    const skip = Math.floor(Math.random() * count);
    const [p] = await prisma.problem.findMany({
      where: fallbackWhere,
      take: 1,
      skip,
      select: { id: true, title: true, difficulty: true },
    });
    if (p) return p;
  }

  return null;
}

function difficultyLabel(d: number): string {
  if (d <= 1000) return 'Easy';
  if (d <= 1800) return 'Medium';
  return 'Hard';
}

export async function runDailyProblemSweep(prisma: PrismaClient): Promise<void> {
  const configs = await prisma.dailyProblemConfig.findMany({
    where: { enabled: true },
  });

  for (const config of configs) {
    try {
      const now = getNowInTimezone(config.timezone);
      const today = getDateInTimezone(config.timezone, 0);
      const yesterday = getDateInTimezone(config.timezone, -1);

      // Check if user is paused
      if (config.pausedUntil && config.pausedUntil > now) {
        continue;
      }

      // Handle yesterday's missed assignment
      const yesterdayAssignment = await prisma.dailyProblemAssignment.findUnique({
        where: { userId_assignedDate: { userId: config.userId, assignedDate: yesterday } },
      });

      if (yesterdayAssignment && !yesterdayAssignment.solved && !yesterdayAssignment.skipped && !yesterdayAssignment.missedAt) {
        if (config.streakFreezes > 0) {
          await prisma.$transaction([
            prisma.dailyProblemAssignment.update({
              where: { id: yesterdayAssignment.id },
              data: { missedAt: now },
            }),
            prisma.dailyProblemConfig.update({
              where: { id: config.id },
              data: { streakFreezes: config.streakFreezes - 1 },
            }),
          ]);
        } else {
          // -3 reputation for missed day
          await prisma.$transaction([
            prisma.dailyProblemAssignment.update({
              where: { id: yesterdayAssignment.id },
              data: { missedAt: now },
            }),
            prisma.dailyProblemConfig.update({
              where: { id: config.id },
              data: { currentStreak: 0 },
            }),
            prisma.reputationEvent.upsert({
              where: {
                userId_source: {
                  userId: config.userId,
                  source: `daily-miss:${yesterdayAssignment.id}`,
                },
              },
              create: {
                userId: config.userId,
                delta: -3,
                reason: 'Missed the daily problem',
                source: `daily-miss:${yesterdayAssignment.id}`,
                category: 'problem',
                createdAt: now,
              },
              update: {},
            }),
          ]);
        }
      }

      // Assign today's problem if not already assigned
      const existing = await prisma.dailyProblemAssignment.findUnique({
        where: { userId_assignedDate: { userId: config.userId, assignedDate: today } },
      });
      if (existing) continue;

      const problem = await selectRandomProblem(prisma, config.userId, config);
      if (!problem) continue;

      await prisma.dailyProblemAssignment.upsert({
        where: { userId_assignedDate: { userId: config.userId, assignedDate: today } },
        create: {
          userId: config.userId,
          problemId: problem.id,
          configId: config.id,
          assignedDate: today,
        },
        update: {},
      });

      await prisma.notification.create({
        data: {
          userId: config.userId,
          type: 'daily_problem',
          title: 'Daily Problem Ready',
          body: `Today's challenge: "${problem.title}" (${difficultyLabel(problem.difficulty)})`,
          link: '/competitions/daily',
        },
      });
    } catch (err) {
      // Log but don't stop the sweep for other users
      console.error(`Daily sweep failed for user ${config.userId}:`, err);
    }
  }
}
