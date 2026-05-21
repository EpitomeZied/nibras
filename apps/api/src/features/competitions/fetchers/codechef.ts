import { rateLimited } from './rate-limiter';
import type { RawContest, RawProblem, RawUserStats, PlatformFetcher } from './types';

const BASE = 'https://www.codechef.com/api';
const DELAY_MS = 1000;

async function ccGet<T>(path: string): Promise<T> {
  return rateLimited('codechef', DELAY_MS, async () => {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`CodeChef API ${res.status}`);
    return (await res.json()) as T;
  });
}

type CcContest = {
  contest_code: string;
  contest_name: string;
  contest_start_date_iso: string;
  contest_end_date_iso: string;
  contest_duration: string;
};

type CcContestList = {
  future_contests: CcContest[];
  present_contests: CcContest[];
  past_contests: CcContest[];
};

export const codechefFetcher: PlatformFetcher = {
  async fetchContests(): Promise<RawContest[]> {
    const data = await ccGet<CcContestList>(
      '/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all'
    );

    const all = [
      ...(data.future_contests ?? []),
      ...(data.present_contests ?? []),
      ...(data.past_contests ?? []).slice(0, 50),
    ];

    return all.map((c) => {
      const startsAt = new Date(c.contest_start_date_iso);
      const endsAt = new Date(c.contest_end_date_iso);
      const durationMinutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
      const now = new Date();
      let phase = 'BEFORE';
      if (now >= startsAt && now <= endsAt) phase = 'CODING';
      else if (now > endsAt) phase = 'FINISHED';

      return {
        platformContestId: c.contest_code,
        name: c.contest_name,
        url: `https://www.codechef.com/${c.contest_code}`,
        startsAt,
        endsAt,
        durationMinutes,
        phase,
        tags: [],
      };
    });
  },

  async fetchProblems(): Promise<RawProblem[]> {
    // CodeChef doesn't have a public bulk problem API
    return [];
  },

  async verifyHandle(handle: string) {
    try {
      const data = await ccGet<{ success: boolean; rating?: number; highest_rating?: number }>(
        `/users/${encodeURIComponent(handle)}`
      );
      return {
        valid: data.success !== false,
        rating: data.rating,
        maxRating: data.highest_rating,
      };
    } catch {
      return { valid: false };
    }
  },

  async fetchUserStats(handle: string): Promise<RawUserStats> {
    try {
      const data = await ccGet<{
        rating?: number;
        highest_rating?: number;
        rating_data?: Array<{
          code: string;
          name: string;
          rating: string;
          rank: string;
          end_date: string;
        }>;
      }>(`/users/${encodeURIComponent(handle)}`);

      return {
        rating: data.rating ?? 0,
        maxRating: data.highest_rating ?? 0,
        contestHistory: (data.rating_data ?? []).map((rc) => ({
          platformContestId: rc.code,
          rank: parseInt(rc.rank, 10) || 0,
          participants: 0,
          ratingBefore: 0,
          ratingAfter: parseInt(rc.rating, 10) || 0,
          delta: 0,
        })),
        solvedProblemIds: [],
      };
    } catch {
      return { rating: 0, maxRating: 0, contestHistory: [], solvedProblemIds: [] };
    }
  },
};
