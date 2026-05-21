import { PrismaClient, CompPlatform } from '@prisma/client';

type RawUserStats = {
  rating: number;
  maxRating: number;
  contestHistory: Array<{
    platformContestId: string;
    rank: number;
    participants: number;
    ratingBefore: number;
    ratingAfter: number;
    delta: number;
  }>;
  solvedProblemIds: string[];
};

type FetcherModule = {
  fetchers: Record<
    string,
    {
      fetchUserStats(handle: string): Promise<RawUserStats>;
    }
  >;
};

let _fetchers: FetcherModule | null = null;
async function loadFetchers(): Promise<FetcherModule> {
  if (!_fetchers) {
    _fetchers = (await import('../fetchers/index')) as FetcherModule;
  }
  return _fetchers;
}

function log(level: string, msg: string, extra?: Record<string, unknown>) {
  process.stdout.write(
    JSON.stringify({ level, time: new Date().toISOString(), msg, ...extra }) + '\n'
  );
}

export async function runAccountStatsSync(prisma: PrismaClient): Promise<void> {
  const { fetchers } = await loadFetchers();

  const accounts = await prisma.linkedAccount.findMany({
    where: { verificationStatus: 'verified' },
  });

  for (const account of accounts) {
    const fetcher = fetchers[account.platform];
    if (!fetcher) continue;

    try {
      const stats = await fetcher.fetchUserStats(account.handle);

      await prisma.linkedAccount.update({
        where: { id: account.id },
        data: {
          platformRating: stats.rating,
          platformMaxRating: stats.maxRating,
          lastSyncAt: new Date(),
        },
      });

      for (const ch of stats.contestHistory) {
        const contest = await prisma.contest.findUnique({
          where: {
            platform_platformContestId: {
              platform: account.platform,
              platformContestId: ch.platformContestId,
            },
          },
        });
        if (!contest) continue;

        await prisma.userContestParticipation.upsert({
          where: {
            userId_contestId: { userId: account.userId, contestId: contest.id },
          },
          create: {
            userId: account.userId,
            contestId: contest.id,
            platform: account.platform,
            rank: ch.rank,
            participants: ch.participants || null,
            ratingBefore: ch.ratingBefore,
            ratingAfter: ch.ratingAfter,
            delta: ch.delta,
          },
          update: {
            rank: ch.rank,
            participants: ch.participants || null,
            ratingBefore: ch.ratingBefore,
            ratingAfter: ch.ratingAfter,
            delta: ch.delta,
          },
        });
      }

      for (const pid of stats.solvedProblemIds) {
        const problem = await prisma.problem.findUnique({
          where: {
            platform_platformProblemId: {
              platform: account.platform,
              platformProblemId: pid,
            },
          },
        });
        if (!problem) continue;

        await prisma.userProblemProgress.upsert({
          where: {
            userId_problemId: { userId: account.userId, problemId: problem.id },
          },
          create: {
            userId: account.userId,
            problemId: problem.id,
            solved: true,
            solvedAt: new Date(),
          },
          update: { solved: true },
        });
      }

      log('info', `Stats sync: ${account.platform}/${account.handle}`, {
        userId: account.userId,
        platform: account.platform,
        contestsFound: stats.contestHistory.length,
        solvedCount: stats.solvedProblemIds.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('warn', `Stats sync failed: ${account.platform}/${account.handle}`, {
        userId: account.userId,
        error: message,
      });
    }
  }
}
