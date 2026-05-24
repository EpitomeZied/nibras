import { rateLimited } from './rate-limiter';
import type { RawContest, RawProblem, RawUserStats, PlatformFetcher } from './types';

const BASE = 'https://codeforces.com/api';
const DELAY_MS = 2000;

type CfResponse<T> = { status: 'OK'; result: T } | { status: 'FAILED'; comment: string };

async function cfGet<T>(path: string): Promise<T> {
  return rateLimited('codeforces', DELAY_MS, async () => {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`Codeforces API ${res.status}: ${res.statusText}`);
    const json = (await res.json()) as CfResponse<T>;
    if (json.status !== 'OK')
      throw new Error(`Codeforces API error: ${(json as { comment: string }).comment}`);
    return json.result;
  });
}

type CfContest = {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
};

type CfProblem = {
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
};

type CfSubmission = {
  id: number;
  creationTimeSeconds: number;
  problem: CfProblem;
  verdict?: string;
};

type CfRatingChange = {
  contestId: number;
  contestName: string;
  rank: number;
  oldRating: number;
  newRating: number;
};

type CfUserInfo = {
  handle: string;
  rating?: number;
  maxRating?: number;
};

const VERIFY_PROBLEMS = [
  { contestId: 1, index: 'A', name: 'Theatre Square' },
  { contestId: 4, index: 'A', name: 'Watermelon' },
  { contestId: 71, index: 'A', name: 'Way Too Long Words' },
  { contestId: 158, index: 'A', name: 'Next Round' },
  { contestId: 231, index: 'A', name: 'Team' },
  { contestId: 263, index: 'A', name: 'Beautiful Matrix' },
  { contestId: 282, index: 'A', name: 'Bit++' },
  { contestId: 339, index: 'A', name: 'Helpful Maths' },
  { contestId: 469, index: 'A', name: 'I Wanna Be the Guy' },
  { contestId: 546, index: 'A', name: 'Soldier and Bananas' },
];

export function pickVerificationProblem() {
  return VERIFY_PROBLEMS[Math.floor(Math.random() * VERIFY_PROBLEMS.length)];
}

export const codeforcesFetcher: PlatformFetcher = {
  async fetchContests(): Promise<RawContest[]> {
    const contests = await cfGet<CfContest[]>('/contest.list');
    return contests
      .filter((c) => c.startTimeSeconds !== undefined)
      .map((c) => {
        const startsAt = new Date(c.startTimeSeconds! * 1000);
        const durationMinutes = Math.round(c.durationSeconds / 60);
        const endsAt = new Date(startsAt.getTime() + c.durationSeconds * 1000);
        return {
          platformContestId: String(c.id),
          name: c.name,
          url: `https://codeforces.com/contest/${c.id}`,
          startsAt,
          endsAt,
          durationMinutes,
          phase: c.phase,
          tags: [c.type.toLowerCase()],
        };
      });
  },

  async fetchProblems(): Promise<RawProblem[]> {
    const data = await cfGet<{ problems: CfProblem[] }>('/problemset.problems');
    return data.problems.map((p) => ({
      platformProblemId: p.contestId ? `${p.contestId}${p.index}` : p.index,
      title: p.name,
      url: p.contestId
        ? `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
        : `https://codeforces.com/problemset/problem/0/${p.index}`,
      difficulty: p.rating ?? 0,
      tags: p.tags,
    }));
  },

  async verifyHandle(handle: string) {
    try {
      const users = await cfGet<CfUserInfo[]>(`/user.info?handles=${encodeURIComponent(handle)}`);
      const user = users[0];
      return { valid: true, rating: user?.rating, maxRating: user?.maxRating };
    } catch {
      return { valid: false };
    }
  },

  async verifyOwnership(handle: string, problemSpec?: string): Promise<{ verified: boolean }> {
    try {
      const submissions = await cfGet<CfSubmission[]>(
        `/user.status?handle=${encodeURIComponent(handle)}&from=1&count=15`
      );
      const twoMinAgo = Math.floor(Date.now() / 1000) - 2 * 60;

      let contestId = 4;
      let index = 'A';
      if (problemSpec) {
        const parts = problemSpec.split('/');
        contestId = parseInt(parts[0], 10);
        index = parts[1] ?? 'A';
      }

      const found = submissions.some(
        (s) =>
          s.problem.contestId === contestId &&
          s.problem.index === index &&
          s.verdict === 'COMPILATION_ERROR' &&
          s.creationTimeSeconds > twoMinAgo
      );
      return { verified: found };
    } catch {
      return { verified: false };
    }
  },

  async fetchUserStats(handle: string): Promise<RawUserStats> {
    const [ratingChanges, submissions, userInfo] = await Promise.all([
      cfGet<CfRatingChange[]>(`/user.rating?handle=${encodeURIComponent(handle)}`),
      cfGet<CfSubmission[]>(`/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`),
      cfGet<CfUserInfo[]>(`/user.info?handles=${encodeURIComponent(handle)}`),
    ]);

    const solvedSet = new Set<string>();
    for (const sub of submissions) {
      if (sub.verdict === 'OK' && sub.problem.contestId) {
        solvedSet.add(`${sub.problem.contestId}${sub.problem.index}`);
      }
    }

    const user = userInfo[0];
    return {
      rating: user?.rating ?? 0,
      maxRating: user?.maxRating ?? 0,
      contestHistory: ratingChanges.map((rc) => ({
        platformContestId: String(rc.contestId),
        rank: rc.rank,
        participants: 0,
        ratingBefore: rc.oldRating,
        ratingAfter: rc.newRating,
        delta: rc.newRating - rc.oldRating,
      })),
      solvedProblemIds: Array.from(solvedSet),
    };
  },
};
