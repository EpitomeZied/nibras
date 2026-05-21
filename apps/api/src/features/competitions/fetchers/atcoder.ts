import { rateLimited } from './rate-limiter';
import type { RawContest, RawProblem, RawUserStats, PlatformFetcher } from './types';

const KENKOOOO_BASE = 'https://kenkoooo.com/atcoder';
const ATCODER_BASE = 'https://atcoder.jp';
const DELAY_MS = 1000;

async function kGet<T>(path: string): Promise<T> {
  return rateLimited('atcoder', DELAY_MS, async () => {
    const res = await fetch(`${KENKOOOO_BASE}${path}`);
    if (!res.ok) throw new Error(`AtCoder API ${res.status}`);
    return (await res.json()) as T;
  });
}

type AtCoderContest = {
  id: string;
  title: string;
  start_epoch_second: number;
  duration_second: number;
  rate_change: string;
};

type AtCoderProblem = {
  id: string;
  contest_id: string;
  title: string;
};

type ProblemModel = {
  difficulty?: number;
};

type AtCoderSubmission = {
  problem_id: string;
  result: string;
};

export const atcoderFetcher: PlatformFetcher = {
  async fetchContests(): Promise<RawContest[]> {
    const now = Math.floor(Date.now() / 1000) - 86400 * 365;
    const contests = await kGet<AtCoderContest[]>(`/resources/contests.json`);
    return contests
      .filter((c) => c.start_epoch_second >= now)
      .map((c) => {
        const startsAt = new Date(c.start_epoch_second * 1000);
        const durationMinutes = Math.round(c.duration_second / 60);
        const endsAt = new Date(startsAt.getTime() + c.duration_second * 1000);
        return {
          platformContestId: c.id,
          name: c.title,
          url: `${ATCODER_BASE}/contests/${c.id}`,
          startsAt,
          endsAt,
          durationMinutes,
          phase: endsAt < new Date() ? 'FINISHED' : startsAt > new Date() ? 'BEFORE' : 'CODING',
          tags: c.rate_change !== '-' ? ['rated'] : ['unrated'],
        };
      });
  },

  async fetchProblems(): Promise<RawProblem[]> {
    const [problems, models] = await Promise.all([
      kGet<AtCoderProblem[]>('/resources/problems.json'),
      kGet<Record<string, ProblemModel>>('/resources/problem-models.json'),
    ]);

    return problems.map((p) => ({
      platformProblemId: p.id,
      title: p.title,
      url: `${ATCODER_BASE}/contests/${p.contest_id}/tasks/${p.id}`,
      difficulty: models[p.id]?.difficulty ? Math.max(0, Math.round(models[p.id].difficulty!)) : 0,
      tags: [],
    }));
  },

  async verifyHandle(handle: string) {
    try {
      const subs = await kGet<AtCoderSubmission[]>(
        `/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=${Math.floor(Date.now() / 1000) - 86400 * 30}`
      );
      return { valid: Array.isArray(subs) };
    } catch {
      return { valid: false };
    }
  },

  async fetchUserStats(handle: string): Promise<RawUserStats> {
    const subs = await kGet<AtCoderSubmission[]>(
      `/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=0`
    );

    const solvedSet = new Set<string>();
    for (const sub of subs) {
      if (sub.result === 'AC') solvedSet.add(sub.problem_id);
    }

    return {
      rating: 0,
      maxRating: 0,
      contestHistory: [],
      solvedProblemIds: Array.from(solvedSet),
    };
  },
};
