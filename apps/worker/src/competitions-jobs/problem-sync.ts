import { PrismaClient } from '@prisma/client';

const PLATFORMS = ['codeforces', 'leetcode', 'atcoder', 'codechef', 'vjudge'] as const;

type FetcherModule = {
  fetchers: Record<
    string,
    {
      fetchProblems(): Promise<
        Array<{
          platformProblemId: string;
          title: string;
          url: string;
          difficulty: number;
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

export async function runProblemSync(prisma: PrismaClient): Promise<void> {
  const { fetchers } = await loadFetchers();

  for (const platform of PLATFORMS) {
    const startedAt = new Date();
    try {
      const fetcher = fetchers[platform];
      if (!fetcher) continue;

      const problems = await fetcher.fetchProblems();
      if (problems.length === 0) {
        log('info', `Problem sync: ${platform} — no problems returned`, { platform });
        continue;
      }

      let upserted = 0;
      const BATCH_SIZE = 100;
      for (let i = 0; i < problems.length; i += BATCH_SIZE) {
        const batch = problems.slice(i, i + BATCH_SIZE);
        for (const p of batch) {
          await prisma.problem.upsert({
            where: {
              platform_platformProblemId: { platform, platformProblemId: p.platformProblemId },
            },
            create: {
              platform,
              platformProblemId: p.platformProblemId,
              title: p.title,
              url: p.url,
              difficulty: p.difficulty,
              tags: p.tags,
            },
            update: {
              title: p.title,
              url: p.url,
              difficulty: p.difficulty,
              tags: p.tags,
            },
          });
          upserted++;
        }
      }

      await prisma.compSyncLog.create({
        data: {
          jobType: 'problem_fetch',
          platform,
          status: 'success',
          itemCount: upserted,
          startedAt,
        },
      });

      log('info', `Problem sync: ${platform} — ${upserted} problems`, { platform, upserted });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('warn', `Problem sync failed: ${platform}`, { platform, error: message });
      await prisma.compSyncLog.create({
        data: {
          jobType: 'problem_fetch',
          platform,
          status: 'error',
          errorMessage: message,
          startedAt,
        },
      });
    }
  }
}
