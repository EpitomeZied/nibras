import {
  serviceFetch,
  serviceFetchOptional,
  type ServiceFetchInit,
} from '../api-clients/service-fetch';
import { ApiError } from '../api-clients/errors';

async function fetchFirstAvailable<T>(paths: string[], init: ServiceFetchInit = {}): Promise<T> {
  let lastError: unknown = null;
  for (const path of paths) {
    try {
      return await serviceFetch<T>('competitions', path, init);
    } catch (error) {
      lastError = error;
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error;
      }
    }
  }
  throw lastError ?? new Error('No compatible competitions endpoint found.');
}

export type Contest = {
  id: string;
  name: string;
  host: 'codeforces' | 'leetcode' | 'atcoder' | 'codechef' | 'vjudge' | string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  url?: string;
  phase?: string;
  tags?: string[];
  registered?: boolean;
  reminderSet?: boolean;
  bookmarked?: boolean;
};

export type CalendarDay = {
  [dateKey: string]: Contest[];
};

export type CalendarData = {
  month: number;
  year: number;
  calendarStart: string;
  calendarEnd: string;
  days: CalendarDay;
};

export type PracticeProblem = {
  id: string;
  title: string;
  host: string;
  difficulty: number;
  tags: string[];
  url: string;
  solved?: boolean;
  bookmarked?: boolean;
};

export type RankingEntry = {
  rank: number;
  userId: string;
  username: string;
  rating: number;
  delta?: number;
  contestsLast30d?: number;
  badges?: number;
};

export type ContestHistoryEntry = {
  contestId: string;
  name: string;
  startedAt: string;
  rank: number;
  participants: number;
  delta: number;
  ratingAfter: number;
};

export type VerificationProblem = {
  contestId: number;
  index: string;
  name: string;
  url: string;
};

export type LinkedAccount = {
  host: 'codeforces' | 'leetcode' | 'atcoder' | 'codechef' | 'vjudge' | string;
  handle: string;
  verified: boolean;
  verificationStatus?: string;
  rating?: number;
  maxRating?: number;
  lastSyncAt?: string;
  linkedAt?: string;
  verificationProblem?: VerificationProblem | null;
};

// ── Contests ────────────────────────────────────────────────────────────────

export async function listContests(filters: { upcoming?: boolean; host?: string } = {}) {
  return serviceFetch<Contest[]>('competitions', '/v1/contests', {
    auth: false,
    query: filters as Record<string, string | boolean>,
  });
}

export async function getCalendarContests(month: number, year: number) {
  return serviceFetch<CalendarData>('competitions', '/v1/contests/calendar', {
    auth: false,
    query: { month: String(month), year: String(year) },
  });
}

export async function setContestReminder(contestId: string, on: boolean) {
  return fetchFirstAvailable<{ reminderSet: boolean }>(
    [`/v1/user-contests/${contestId}/reminder`],
    { method: 'POST', auth: true, body: { on } }
  );
}

export async function setContestBookmark(contestId: string, on: boolean) {
  return fetchFirstAvailable<{ bookmarked: boolean }>([`/v1/user-contests/${contestId}/bookmark`], {
    method: 'POST',
    auth: true,
    body: { on },
  });
}

// ── Practice problems ───────────────────────────────────────────────────────

export async function listProblems(
  filters: {
    tag?: string;
    difficultyMin?: number;
    difficultyMax?: number;
    host?: string;
    q?: string;
    page?: number;
    limit?: number;
    solved?: string;
  } = {}
) {
  return serviceFetch<{ items: PracticeProblem[]; total: number }>('competitions', '/v1/problems', {
    auth: true,
    query: filters as Record<string, string | number>,
  });
}

export async function setProblemBookmark(
  problemId: string,
  on: boolean
): Promise<{ bookmarked: boolean }> {
  const data = await serviceFetchOptional<{ bookmarked: boolean }>(
    'competitions',
    `/v1/problems/${problemId}/bookmark`,
    { method: 'POST', auth: true, body: { on } }
  );
  return data ?? { bookmarked: on };
}

// ── Ranking ─────────────────────────────────────────────────────────────────

export async function getRanking(host?: string, scope?: string): Promise<RankingEntry[]> {
  const query: Record<string, string> = {};
  if (host) query.host = host;
  if (scope) query.scope = scope;
  const data = await serviceFetchOptional<RankingEntry[]>('competitions', '/v1/ranking', {
    auth: true,
    query: Object.keys(query).length > 0 ? query : undefined,
  });
  return data ?? [];
}

// ── History ─────────────────────────────────────────────────────────────────

export async function getMyHistory(host?: string): Promise<ContestHistoryEntry[]> {
  const query = host ? { host } : undefined;
  const data = await serviceFetchOptional<ContestHistoryEntry[]>(
    'competitions',
    '/v1/user-contests/history',
    { auth: true, query }
  );
  return data ?? [];
}

// ── Linked accounts ─────────────────────────────────────────────────────────

export async function getLinkedAccounts(): Promise<LinkedAccount[]> {
  const data = await serviceFetchOptional<LinkedAccount[]>(
    'competitions',
    '/v1/contests/accounts',
    { auth: true }
  );
  return data ?? [];
}

export async function linkAccount(payload: { host: string; handle: string; token?: string }) {
  return serviceFetch<LinkedAccount>('competitions', '/v1/contests/accounts/link', {
    method: 'POST',
    auth: true,
    body: {
      platform: payload.host,
      handle: payload.handle,
      ...(payload.token ? { token: payload.token } : {}),
    },
  });
}

export async function unlinkAccount(host: string): Promise<{ unlinked: true } | null> {
  return serviceFetchOptional<{ unlinked: true }>('competitions', `/v1/contests/accounts/${host}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function verifyAccount(host: string): Promise<{
  verified: boolean;
  handle?: string;
  rating?: number;
  maxRating?: number;
}> {
  const data = await serviceFetch<{
    verified: boolean;
    handle?: string;
    rating?: number;
    maxRating?: number;
  }>('competitions', `/v1/contests/accounts/${host}/verify`, {
    method: 'POST',
    auth: true,
  });
  return data;
}

export async function resyncAccount(host: string): Promise<{ syncing: boolean } | null> {
  return serviceFetchOptional<{ syncing: boolean }>(
    'competitions',
    `/v1/contests/accounts/${host}/resync`,
    { method: 'POST', auth: true }
  );
}

// ── Practice (Codeforces) ─────────────────────────────────────────────────────

export type PracticeCfProblem = {
  problemId: string;
  index: string;
  name: string;
  url: string;
  solved: boolean;
  attempted: boolean;
  solvedCount?: number;
  rating?: number;
  tags?: string[];
  contestId?: string;
};

export type PracticeCfProblemsResponse = {
  items: PracticeCfProblem[];
  total: number;
  solvedCount: number;
  handle: string | null;
  page: number;
  limit: number;
};

export type CfAnalyticsStats = {
  totalSubmissions: number;
  solvedProblems: number;
  maxStreak: number;
  totalPoints: number;
  acRate: number;
  highestRating: number;
};

export type CfAnalyticsPayload = {
  rating: Record<string, number>;
  tags: Record<string, number>;
  lang: Record<string, number>;
  verdicts: Record<string, number>;
  participantType: Record<string, number>;
  attempts: Record<string, number>;
  timeline: Record<string, number>;
  performance: Array<[number, number, string]>;
  memoryPerformance: Array<[number, number, string]>;
  speedAnalysis: Record<string, number>;
  stats: CfAnalyticsStats;
  handle?: string;
};

export type PracticeCfProblemsParams = {
  handle?: string;
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
  ratingMin?: number;
  ratingMax?: number;
  contestIdMin?: number;
  contestIdMax?: number;
  solved?: 'true' | 'false';
};

export async function getPracticeCfProblems(
  params?: PracticeCfProblemsParams
): Promise<PracticeCfProblemsResponse> {
  const query: Record<string, string> = {};
  if (params?.handle) query.handle = params.handle;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.q) query.q = params.q;
  if (params?.tag) query.tag = params.tag;
  if (params?.ratingMin !== undefined) query.ratingMin = String(params.ratingMin);
  if (params?.ratingMax !== undefined) query.ratingMax = String(params.ratingMax);
  if (params?.contestIdMin !== undefined) query.contestIdMin = String(params.contestIdMin);
  if (params?.contestIdMax !== undefined) query.contestIdMax = String(params.contestIdMax);
  if (params?.solved) query.solved = params.solved;

  return serviceFetch<PracticeCfProblemsResponse>(
    'competitions',
    '/v1/practice/codeforces/problems',
    { auth: true, query: Object.keys(query).length ? query : undefined }
  );
}

export async function getPracticeCfAnalytics(handle?: string): Promise<CfAnalyticsPayload> {
  const query = handle ? { handle } : undefined;
  return serviceFetch<CfAnalyticsPayload>('competitions', '/v1/practice/codeforces/analytics', {
    auth: true,
    query,
  });
}

// ── Practice (LeetCode) ───────────────────────────────────────────────────────

export type PracticeLcProblem = {
  problemId: string;
  index: string;
  name: string;
  url: string;
  solved: boolean;
  attempted: boolean;
  rating?: number;
  difficultyLabel?: string;
  tags?: string[];
  acRate?: number;
};

export type PracticeLcProblemsResponse = {
  items: PracticeLcProblem[];
  total: number;
  solvedCount: number;
  handle: string | null;
  page: number;
  limit: number;
};

export type LcAnalyticsPayload = CfAnalyticsPayload;

export type PracticeLcProblemsParams = {
  handle?: string;
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  solved?: 'true' | 'false';
};

export async function getPracticeLcProblems(
  params?: PracticeLcProblemsParams
): Promise<PracticeLcProblemsResponse> {
  const query: Record<string, string> = {};
  if (params?.handle) query.handle = params.handle;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.q) query.q = params.q;
  if (params?.tag) query.tag = params.tag;
  if (params?.difficulty) query.difficulty = params.difficulty;
  if (params?.solved) query.solved = params.solved;

  return serviceFetch<PracticeLcProblemsResponse>(
    'competitions',
    '/v1/practice/leetcode/problems',
    { auth: true, query: Object.keys(query).length ? query : undefined }
  );
}

export async function getPracticeLcAnalytics(handle?: string): Promise<LcAnalyticsPayload> {
  const query = handle ? { handle } : undefined;
  return serviceFetch<LcAnalyticsPayload>('competitions', '/v1/practice/leetcode/analytics', {
    auth: true,
    query,
  });
}

// ── Nibras 75 (interview) ─────────────────────────────────────────────────────

export type Nibras75Company = {
  id: string;
  name: string;
  domain: string;
  iconUrl: string;
};

export type Nibras75Problem = {
  rank: number;
  problemId: string;
  name: string;
  url: string;
  difficulty: string;
  description: string;
  tags: string[];
  askedByCount: number;
  companies: Nibras75Company[];
  solved: boolean;
  attempted: boolean;
  userMarked: boolean;
};

export type Nibras75ProblemsResponse = {
  title: string;
  subtitle: string;
  totalCurriculum: number;
  items: Nibras75Problem[];
  total: number;
  solvedCount: number;
  completedInSet: number;
  handle: string | null;
};

export type Nibras75ProblemsParams = {
  handle?: string;
  q?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  solved?: 'true' | 'false';
};

export async function getNibras75Problems(
  params?: Nibras75ProblemsParams
): Promise<Nibras75ProblemsResponse> {
  const query: Record<string, string> = {};
  if (params?.handle) query.handle = params.handle;
  if (params?.q) query.q = params.q;
  if (params?.difficulty) query.difficulty = params.difficulty;
  if (params?.solved) query.solved = params.solved;

  return serviceFetch<Nibras75ProblemsResponse>('competitions', '/v1/practice/nibras-75/problems', {
    auth: true,
    query: Object.keys(query).length ? query : undefined,
  });
}

export async function setNibras75ProblemSolved(
  slug: string,
  solved: boolean
): Promise<{ solved: boolean; problemId: string }> {
  return serviceFetch<{ solved: boolean; problemId: string }>(
    'competitions',
    `/v1/practice/nibras-75/problems/${encodeURIComponent(slug)}/solved`,
    { method: 'POST', auth: true, body: { solved } }
  );
}

export type Nibras75Workspace = {
  id: string;
  owner: string;
  repoName: string;
  fullName: string;
  htmlUrl: string;
  cloneUrl: string | null;
};

export async function getNibras75Workspace(): Promise<{ workspace: Nibras75Workspace | null }> {
  return serviceFetch<{ workspace: Nibras75Workspace | null }>(
    'competitions',
    '/v1/practice/nibras-75/workspace',
    { auth: true }
  );
}

export async function forkNibras75Workspace(): Promise<{ workspace: Nibras75Workspace }> {
  return serviceFetch<{ workspace: Nibras75Workspace }>(
    'competitions',
    '/v1/practice/nibras-75/workspace/fork',
    { method: 'POST', auth: true, body: {} }
  );
}

export type PlatformIntegrationCategory =
  | 'competitive_programming'
  | 'ai_ml'
  | 'bug_bounty'
  | 'open_source'
  | 'math_olympiad'
  | 'ctf';

export type PlatformIntegration = {
  id: string;
  name: string;
  category: PlatformIntegrationCategory;
  status: 'live' | 'beta' | 'coming_soon';
  description: string;
  externalUrl: string;
  linkHost?: string;
  href?: string;
};

export async function getPlatformIntegrations(): Promise<{
  categories: Record<PlatformIntegrationCategory, { label: string; description: string }>;
  integrations: PlatformIntegration[];
}> {
  return serviceFetch('competitions', '/v1/competitions/integrations', { auth: false });
}
