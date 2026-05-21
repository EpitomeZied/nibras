import { rateLimited } from './rate-limiter';
import type { RawContest, RawProblem, RawUserStats, PlatformFetcher } from './types';

const BASE = 'https://leetcode.com';
const DELAY_MS = 4000;

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  return rateLimited('leetcode', DELAY_MS, async () => {
    const res = await fetch(`${BASE}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`LeetCode GraphQL ${res.status}`);
    const json = (await res.json()) as { data: T; errors?: Array<{ message: string }> };
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return json.data;
  });
}

export const leetcodeFetcher: PlatformFetcher = {
  async fetchContests(): Promise<RawContest[]> {
    const data = await gql<{
      topTwoContests: Array<{
        title: string;
        titleSlug: string;
        startTime: number;
        duration: number;
      }>;
    }>(`{ topTwoContests { title titleSlug startTime duration } }`);

    return (data.topTwoContests ?? []).map((c) => {
      const startsAt = new Date(c.startTime * 1000);
      const durationMinutes = Math.round(c.duration / 60);
      const endsAt = new Date(startsAt.getTime() + c.duration * 1000);
      return {
        platformContestId: c.titleSlug,
        name: c.title,
        url: `${BASE}/contest/${c.titleSlug}/`,
        startsAt,
        endsAt,
        durationMinutes,
        phase: startsAt > new Date() ? 'BEFORE' : 'FINISHED',
        tags: ['weekly'],
      };
    });
  },

  async fetchProblems(): Promise<RawProblem[]> {
    const problems: RawProblem[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const data = await gql<{
        problemsetQuestionList: {
          total: number;
          questions: Array<{
            titleSlug: string;
            title: string;
            difficulty: string;
            topicTags: Array<{ slug: string }>;
          }>;
        };
      }>(
        `query($limit: Int!, $skip: Int!) {
          problemsetQuestionList: questionList(categorySlug: "" limit: $limit skip: $skip filters: {}) {
            total
            questions: data {
              titleSlug title difficulty
              topicTags { slug }
            }
          }
        }`,
        { limit, skip: offset }
      );

      const questions = data.problemsetQuestionList?.questions ?? [];
      for (const q of questions) {
        const diffMap: Record<string, number> = { Easy: 800, Medium: 1500, Hard: 2200 };
        problems.push({
          platformProblemId: q.titleSlug,
          title: q.title,
          url: `${BASE}/problems/${q.titleSlug}/`,
          difficulty: diffMap[q.difficulty] ?? 0,
          tags: q.topicTags.map((t) => t.slug),
        });
      }

      offset += limit;
      hasMore = questions.length === limit && offset < (data.problemsetQuestionList?.total ?? 0);
    }

    return problems;
  },

  async verifyHandle(handle: string) {
    try {
      const data = await gql<{
        matchedUser: { username: string; profile: { ranking: number } } | null;
      }>(
        `query($username: String!) {
          matchedUser(username: $username) {
            username
            profile { ranking }
          }
        }`,
        { username: handle }
      );
      if (!data.matchedUser) return { valid: false };
      return { valid: true, rating: data.matchedUser.profile.ranking };
    } catch {
      return { valid: false };
    }
  },

  async fetchUserStats(handle: string): Promise<RawUserStats> {
    const data = await gql<{
      userContestRanking: { rating: number; globalRanking: number } | null;
      userContestRankingHistory: Array<{
        contest: { titleSlug: string };
        ranking: number;
        rating: number;
      }> | null;
      matchedUser: {
        submitStatsGlobal: {
          acSubmissionNum: Array<{ difficulty: string; count: number }>;
        };
      } | null;
    }>(
      `query($username: String!) {
        userContestRanking(username: $username) { rating globalRanking }
        userContestRankingHistory(username: $username) {
          contest { titleSlug }
          ranking rating
        }
        matchedUser(username: $username) {
          submitStatsGlobal { acSubmissionNum { difficulty count } }
        }
      }`,
      { username: handle }
    );

    const rating = Math.round(data.userContestRanking?.rating ?? 0);
    const history = (data.userContestRankingHistory ?? [])
      .filter((h) => h.ranking > 0)
      .map((h, i, arr) => ({
        platformContestId: h.contest.titleSlug,
        rank: h.ranking,
        participants: 0,
        ratingBefore: i > 0 ? Math.round(arr[i - 1].rating) : 0,
        ratingAfter: Math.round(h.rating),
        delta: i > 0 ? Math.round(h.rating - arr[i - 1].rating) : 0,
      }));

    return {
      rating,
      maxRating: rating,
      contestHistory: history,
      solvedProblemIds: [],
    };
  },
};
