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

// ── Codehunt ──────────────────────────────────────────────────────────────────

export type CodehuntProblem = {
  problemId: string;
  index: string;
  name: string;
  url: string;
  solved: boolean;
  attempted: boolean;
  solvedCount?: number;
  percentageAccepted?: number;
  rating?: number;
  tags?: string[];
  contestId?: string;
};

export type CodehuntProblemsResponse = {
  items: CodehuntProblem[];
  total: number;
  solvedCount: number;
  handle: string | null;
};

export async function getCodehuntProblems(
  site: 'uhunt' | 'codeforces',
  handle?: string
): Promise<CodehuntProblemsResponse> {
  const query = handle ? { handle } : undefined;
  return serviceFetch<CodehuntProblemsResponse>('competitions', `/v1/codehunt/${site}/problems`, {
    auth: true,
    query,
  });
}
