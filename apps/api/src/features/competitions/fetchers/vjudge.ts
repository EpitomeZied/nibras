import { rateLimited } from './rate-limiter';
import type { RawContest, RawProblem, RawUserStats, PlatformFetcher } from './types';

const BASE = 'https://vjudge.net';
const DELAY_MS = 5000;

async function vjGet<T>(path: string): Promise<T> {
  return rateLimited('vjudge', DELAY_MS, async () => {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`VJudge ${res.status}`);
    return (await res.json()) as T;
  });
}

type VjContestRow = [
  number, // id
  string, // title
  number, // begin (epoch ms)
  number, // length (ms)
  number, // 4
  number, // 5
  string, // 6 - author
  number, // 7
  string, // 8
  number, // 9
];

type VjContestResponse = {
  data: VjContestRow[];
};

export const vjudgeFetcher: PlatformFetcher = {
  async fetchContests(): Promise<RawContest[]> {
    const data = await vjGet<VjContestResponse>(
      '/contest/data?draw=1&start=0&length=50&sortDir=desc&sortCol=3&category=all&running=0&title='
    );

    return (data.data ?? []).map((row) => {
      const startsAt = new Date(row[2]);
      const durationMs = row[3];
      const endsAt = new Date(startsAt.getTime() + durationMs);
      const durationMinutes = Math.round(durationMs / 60000);
      const now = new Date();
      let phase = 'BEFORE';
      if (now >= startsAt && now <= endsAt) phase = 'CODING';
      else if (now > endsAt) phase = 'FINISHED';

      return {
        platformContestId: String(row[0]),
        name: row[1],
        url: `${BASE}/contest/${row[0]}`,
        startsAt,
        endsAt,
        durationMinutes,
        phase,
        tags: [],
      };
    });
  },

  async fetchProblems(): Promise<RawProblem[]> {
    // VJudge proxies problems from other OJs; no bulk API
    return [];
  },

  async verifyHandle(handle: string) {
    try {
      const data = await vjGet<Record<string, unknown>>(
        `/user/solveDetail/${encodeURIComponent(handle)}`
      );
      return { valid: data !== null && typeof data === 'object' };
    } catch {
      return { valid: false };
    }
  },

  async fetchUserStats(handle: string): Promise<RawUserStats> {
    try {
      const data = await vjGet<Record<string, Record<string, unknown>>>(
        `/user/solveDetail/${encodeURIComponent(handle)}`
      );
      const solvedIds: string[] = [];
      if (data && typeof data === 'object') {
        for (const [oj, problems] of Object.entries(data)) {
          if (typeof problems === 'object' && problems !== null) {
            for (const pid of Object.keys(problems)) {
              solvedIds.push(`${oj}-${pid}`);
            }
          }
        }
      }
      return {
        rating: 0,
        maxRating: 0,
        contestHistory: [],
        solvedProblemIds: solvedIds,
      };
    } catch {
      return { rating: 0, maxRating: 0, contestHistory: [], solvedProblemIds: [] };
    }
  },
};
