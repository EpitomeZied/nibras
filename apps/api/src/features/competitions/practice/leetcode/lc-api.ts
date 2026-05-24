import { rateLimited } from '../../fetchers/rate-limiter';

const LC_BASE = 'https://leetcode.com';
const DELAY_MS = 4000;
const PROBLEMSET_TTL_MS = 60 * 60 * 1000;
const USER_TTL_MS = 15 * 60 * 1000;
const PAGE_SIZE = 100;
const RECENT_LIMIT = 20;

export type LcQuestion = {
  titleSlug: string;
  title: string;
  difficulty: string;
  tags: string[];
  acRate?: number;
  frontendQuestionId?: string;
};

export type LcRecentSubmission = {
  titleSlug: string;
  title: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
  runtime?: string;
  memory?: string;
};

export type LcUserProfile = {
  submitStatsGlobal: {
    acSubmissionNum: Array<{ difficulty: string; count: number; submissions: number }>;
    totalSubmissionNum: Array<{ difficulty: string; count: number; submissions: number }>;
  };
  languageProblemCount: Array<{ languageName: string; problemsSolved: number }>;
  tagProblemCounts: {
    advanced: Array<{ tagName: string; problemsSolved: number }>;
    intermediate: Array<{ tagName: string; problemsSolved: number }>;
    fundamental: Array<{ tagName: string; problemsSolved: number }>;
  };
  recentSubmissions: LcRecentSubmission[];
  recentAcSlugs: string[];
};

type CachedProblemset = {
  problems: LcQuestion[];
  expiresAt: number;
};

const userCache = new Map<string, { profile: LcUserProfile; statusMap: Map<string, { solved: boolean; attempted: boolean }>; expiresAt: number }>();
let problemsetCache: CachedProblemset | null = null;

export const DIFFICULTY_SCORE: Record<string, number> = {
  Easy: 800,
  Medium: 1500,
  Hard: 2200,
};

async function lcGql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  return rateLimited('leetcode', DELAY_MS, async () => {
    const res = await fetch(`${LC_BASE}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`LeetCode GraphQL ${res.status}: ${res.statusText}`);
    const json = (await res.json()) as { data: T; errors?: Array<{ message: string }> };
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return json.data;
  });
}

export function questionUrl(slug: string): string {
  return `${LC_BASE}/problems/${slug}/`;
}

export async function getCachedLcProblemset(): Promise<LcQuestion[]> {
  const now = Date.now();
  if (problemsetCache && problemsetCache.expiresAt > now) {
    return problemsetCache.problems;
  }

  const problems: LcQuestion[] = [];
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    const data = await lcGql<{
      problemsetQuestionList: {
        total: number;
        questions: Array<{
          titleSlug: string;
          title: string;
          difficulty: string;
          acRate?: number;
          frontendQuestionId?: string;
          topicTags: Array<{ slug: string }>;
        }>;
      };
    }>(
      `query($limit: Int!, $skip: Int!) {
        problemsetQuestionList: questionList(categorySlug: "" limit: $limit skip: $skip filters: {}) {
          total: totalNum
          questions: data {
            titleSlug title difficulty acRate
            frontendQuestionId: questionFrontendId
            topicTags { slug }
          }
        }
      }`,
      { limit: PAGE_SIZE, skip }
    );

    const batch = data.problemsetQuestionList?.questions ?? [];
    total = data.problemsetQuestionList?.total ?? 0;
    for (const q of batch) {
      problems.push({
        titleSlug: q.titleSlug,
        title: q.title,
        difficulty: q.difficulty,
        acRate: q.acRate,
        frontendQuestionId: q.frontendQuestionId,
        tags: q.topicTags.map((t) => t.slug),
      });
    }
    skip += PAGE_SIZE;
    if (batch.length < PAGE_SIZE) break;
  }

  problemsetCache = { problems, expiresAt: now + PROBLEMSET_TTL_MS };
  return problems;
}

export async function fetchLcUserProfile(username: string): Promise<LcUserProfile> {
  const key = username.trim().toLowerCase();
  const now = Date.now();
  const cached = userCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.profile;
  }

  const data = await lcGql<{
    matchedUser: {
      submitStatsGlobal: LcUserProfile['submitStatsGlobal'];
      languageProblemCount: LcUserProfile['languageProblemCount'];
      tagProblemCounts: LcUserProfile['tagProblemCounts'];
    } | null;
    recentSubmissionList: LcRecentSubmission[];
    recentAcSubmissionList: Array<{ titleSlug: string }>;
  }>(
    `query($username: String!, $limit: Int!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum { difficulty count submissions }
          totalSubmissionNum { difficulty count submissions }
        }
        languageProblemCount { languageName problemsSolved }
        tagProblemCounts {
          advanced { tagName problemsSolved }
          intermediate { tagName problemsSolved }
          fundamental { tagName problemsSolved }
        }
      }
      recentSubmissionList(username: $username limit: $limit) {
        title titleSlug timestamp statusDisplay lang runtime memory
      }
      recentAcSubmissionList(username: $username limit: $limit) { titleSlug }
    }`,
    { username: username.trim(), limit: RECENT_LIMIT }
  );

  if (!data.matchedUser) {
    throw new Error('LeetCode username not found');
  }

  const profile: LcUserProfile = {
    submitStatsGlobal: data.matchedUser.submitStatsGlobal,
    languageProblemCount: data.matchedUser.languageProblemCount ?? [],
    tagProblemCounts: data.matchedUser.tagProblemCounts ?? {
      advanced: [],
      intermediate: [],
      fundamental: [],
    },
    recentSubmissions: data.recentSubmissionList ?? [],
    recentAcSlugs: (data.recentAcSubmissionList ?? []).map((s) => s.titleSlug),
  };

  const statusMap = new Map<string, { solved: boolean; attempted: boolean }>();
  for (const slug of profile.recentAcSlugs) {
    statusMap.set(slug, { solved: true, attempted: true });
  }
  for (const sub of profile.recentSubmissions) {
    const entry = statusMap.get(sub.titleSlug) ?? { solved: false, attempted: false };
    entry.attempted = true;
    if (sub.statusDisplay === 'Accepted') entry.solved = true;
    statusMap.set(sub.titleSlug, entry);
  }

  userCache.set(key, { profile, statusMap, expiresAt: now + USER_TTL_MS });
  return profile;
}

export async function getLcUserStatus(
  username: string | undefined
): Promise<Map<string, { solved: boolean; attempted: boolean }>> {
  if (!username?.trim()) return new Map();
  const key = username.trim().toLowerCase();
  const now = Date.now();
  const cached = userCache.get(key);
  if (cached && cached.expiresAt > now) return cached.statusMap;
  await fetchLcUserProfile(username);
  return userCache.get(key)?.statusMap ?? new Map();
}

export function getRecentAcSlugs(username: string): string[] {
  const key = username.trim().toLowerCase();
  return userCache.get(key)?.profile.recentAcSlugs ?? [];
}
