import { PrismaClient } from '@prisma/client';
import {
  selectDailyProblem,
  getUserToday,
  getUserYesterday,
  difficultyLabel,
} from '@nibras/daily-problem';

const NIBRAS_75_SLUGS = [
  'two-sum', 'lru-cache', 'merge-intervals', 'best-time-to-buy-and-sell-stock',
  'longest-substring-without-repeating-characters', 'valid-parentheses', 'number-of-islands',
  'group-anagrams', 'trapping-rain-water', 'longest-palindromic-substring', 'top-k-frequent-elements',
  'median-of-two-sorted-arrays', '3sum', 'subarray-sum-equals-k', 'merge-k-sorted-lists',
  'longest-common-prefix', 'search-in-rotated-sorted-array', 'maximum-subarray', 'rotate-image',
  'spiral-matrix', 'add-two-numbers', 'kth-largest-element-in-an-array', 'generate-parentheses',
  'rotting-oranges', 'find-first-and-last-position-of-element-in-sorted-array', 'merge-sorted-array',
  'roman-to-integer', 'house-robber', 'palindrome-number', 'move-zeroes', 'container-with-most-water',
  'meeting-rooms-ii', 'coin-change', 'valid-anagram', 'product-of-array-except-self',
  'longest-consecutive-sequence', 'koko-eating-bananas', 'jump-game', 'integer-to-roman',
  'course-schedule', 'minimum-window-substring', 'reverse-linked-list', 'next-permutation',
  'sliding-window-maximum', 'course-schedule-ii', 'merge-two-sorted-lists', 'valid-palindrome',
  'remove-duplicates-from-sorted-array', 'find-peak-element', 'word-ladder',
  'best-time-to-buy-and-sell-stock-ii', 'subsets', 'rotate-array', 'min-stack', 'word-break',
  'word-search', 'contains-duplicate', 'longest-increasing-subsequence', 'reorganize-string',
  'climbing-stairs', 'string-compression', 'sort-colors', 'jump-game-ii', 'decode-string',
  'binary-tree-maximum-path-sum', 'copy-list-with-random-pointer', 'valid-sudoku',
  'letter-combinations-of-a-phone-number', 'daily-temperatures', 'candy', 'powx-n',
  'lfu-cache', 'simplify-path', 'basic-calculator', 'majority-element',
];

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

      const nibras75Config = await prisma.nibras75Config.findUnique({
        where: { userId: config.userId },
      });
      const platformProblemIds = nibras75Config?.useForDailyProblem ? NIBRAS_75_SLUGS : undefined;

      const problem = await selectDailyProblem(prisma, config.userId, config, { platformProblemIds });
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
