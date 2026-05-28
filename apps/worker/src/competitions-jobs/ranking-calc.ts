import { PrismaClient } from '@prisma/client';

function log(level: string, msg: string, extra?: Record<string, unknown>) {
  process.stdout.write(
    JSON.stringify({ level, time: new Date().toISOString(), msg, ...extra }) + '\n'
  );
}

async function calcRankingForScope(
  prisma: PrismaClient,
  scope: string,
  userIds: string[]
): Promise<void> {
  const platforms = ['all', 'codeforces', 'leetcode', 'atcoder', 'codechef'];

  for (const platform of platforms) {
    const accountFilter = platform === 'all' ? {} : { platform: platform as never };
    const userRatings: Array<{
      userId: string;
      rating: number;
      delta: number;
      contestsLast30d: number;
    }> = [];

    for (const userId of userIds) {
      const accounts = await prisma.linkedAccount.findMany({
        where: { userId, verificationStatus: 'verified', ...accountFilter },
      });

      if (accounts.length === 0) continue;

      const maxRating = Math.max(...accounts.map((a) => a.platformRating ?? 0));

      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
      const contestCount = await prisma.userContestParticipation.count({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
          ...(platform !== 'all' ? { platform: platform as never } : {}),
        },
      });

      const latestParticipation = await prisma.userContestParticipation.findFirst({
        where: {
          userId,
          ...(platform !== 'all' ? { platform: platform as never } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      userRatings.push({
        userId,
        rating: maxRating,
        delta: latestParticipation?.delta ?? 0,
        contestsLast30d: contestCount,
      });
    }

    userRatings.sort((a, b) => b.rating - a.rating);

    for (let i = 0; i < userRatings.length; i++) {
      const entry = userRatings[i];
      await prisma.cachedRanking.upsert({
        where: {
          userId_scope_platform: { userId: entry.userId, scope, platform },
        },
        create: {
          userId: entry.userId,
          scope,
          platform,
          rank: i + 1,
          rating: entry.rating,
          delta: entry.delta,
          contestsLast30d: entry.contestsLast30d,
          calculatedAt: new Date(),
        },
        update: {
          rank: i + 1,
          rating: entry.rating,
          delta: entry.delta,
          contestsLast30d: entry.contestsLast30d,
          calculatedAt: new Date(),
        },
      });
    }
  }
}

export async function runRankingCalc(prisma: PrismaClient): Promise<void> {
  // Global ranking: all users with linked accounts
  const allLinked = await prisma.linkedAccount.findMany({
    where: { verificationStatus: 'verified' },
    select: { userId: true },
    distinct: ['userId'],
  });
  const globalUserIds = allLinked.map((a) => a.userId);

  if (globalUserIds.length > 0) {
    await calcRankingForScope(prisma, 'global', globalUserIds);
    log('info', `Ranking calc: global — ${globalUserIds.length} users`);
  }

  // Per-course cohort rankings
  const activeCourses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  for (const course of activeCourses) {
    const members = await prisma.courseMembership.findMany({
      where: { courseId: course.id, role: 'student' },
      select: { userId: true },
    });
    const memberIds = members.map((m) => m.userId);
    const linkedMembers = memberIds.filter((uid) => globalUserIds.includes(uid));

    if (linkedMembers.length > 0) {
      await calcRankingForScope(prisma, course.id, linkedMembers);
      log('info', `Ranking calc: course ${course.id} — ${linkedMembers.length} users`);
    }
  }
}
