import { PrismaClient } from '@prisma/client';
import {
  selectDailyProblem,
  getUserToday,
  getUserYesterday,
  difficultyLabel,
} from '@nibras/daily-problem';

export async function runDailyProblemSweep(prisma: PrismaClient): Promise<void> {
  const configs = await prisma.dailyProblemConfig.findMany({
    where: { enabled: true },
  });

  for (const config of configs) {
    try {
      const now = new Date();
      const today = getUserToday(config.timezone);
      const yesterday = getUserYesterday(config.timezone);

      if (config.pausedUntil && config.pausedUntil > now) {
        continue;
      }

      const yesterdayAssignment = await prisma.dailyProblemAssignment.findUnique({
        where: { userId_assignedDate: { userId: config.userId, assignedDate: yesterday } },
      });

      if (
        yesterdayAssignment &&
        !yesterdayAssignment.solved &&
        !yesterdayAssignment.skipped &&
        !yesterdayAssignment.missedAt
      ) {
        if (config.streakFreezes > 0) {
          await prisma.$transaction([
            prisma.dailyProblemAssignment.update({
              where: { id: yesterdayAssignment.id },
              data: { missedAt: now, skipped: true },
            }),
            prisma.dailyProblemConfig.update({
              where: { id: config.id },
              data: { streakFreezes: config.streakFreezes - 1, lastCompletedDate: yesterday },
            }),
          ]);
        } else {
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

      const existing = await prisma.dailyProblemAssignment.findUnique({
        where: { userId_assignedDate: { userId: config.userId, assignedDate: today } },
      });
      if (existing) continue;

      const problem = await selectDailyProblem(prisma, config.userId, config);
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
      console.error(`Daily sweep failed for user ${config.userId}:`, err);
    }
  }
}
