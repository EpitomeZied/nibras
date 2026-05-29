import { PrismaClient } from '@prisma/client';

const PLATFORMS = ['codeforces', 'leetcode', 'atcoder', 'codechef', 'ctftime'] as const;

type FetcherModule = {
  fetchers: Record<
    string,
    {
      fetchContests(): Promise<
        Array<{
          platformContestId: string;
          name: string;
          url: string;
          startsAt: Date;
          endsAt: Date;
          durationMinutes: number;
          phase: string;
          tags: string[];
        }>
      >;
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

export async function runContestSync(prisma: PrismaClient): Promise<void> {
  const { fetchers } = await loadFetchers();

  for (const platform of PLATFORMS) {
    const startedAt = new Date();
    try {
      const fetcher = fetchers[platform];
      if (!fetcher) continue;

      const contests = await fetcher.fetchContests();
      let upserted = 0;

      for (const c of contests) {
        await prisma.contest.upsert({
          where: {
            platform_platformContestId: { platform, platformContestId: c.platformContestId },
          },
          create: {
            platform,
            platformContestId: c.platformContestId,
            name: c.name,
            url: c.url,
            startsAt: c.startsAt,
            endsAt: c.endsAt,
            durationMinutes: c.durationMinutes,
            phase: c.phase,
            tags: c.tags,
          },
          update: {
            name: c.name,
            url: c.url,
            startsAt: c.startsAt,
            endsAt: c.endsAt,
            durationMinutes: c.durationMinutes,
            phase: c.phase,
            tags: c.tags,
          },
        });
        upserted++;
      }

      await prisma.compSyncLog.create({
        data: {
          jobType: 'contest_fetch',
          platform,
          status: 'success',
          itemCount: upserted,
          startedAt,
        },
      });

      log('info', `Contest sync: ${platform} — ${upserted} contests`, { platform, upserted });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('warn', `Contest sync failed: ${platform}`, { platform, error: message });
      await prisma.compSyncLog.create({
        data: {
          jobType: 'contest_fetch',
          platform,
          status: 'error',
          errorMessage: message,
          startedAt,
        },
      });
    }
  }
}
