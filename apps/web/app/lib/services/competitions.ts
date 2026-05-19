import {
  serviceFetch,
  serviceFetchOptional,
  type ServiceFetchInit,
} from '../api-clients/service-fetch';
import { ApiError } from '../api-clients/errors';

/**
 * Try a list of path candidates in order, returning the first non-404 result.
 * Mirrors the legacy dashboard's `requestCompetitionsWithCompatibility` helper
 * (`nibras-student-dashboard/client/services/api.js:1800-1830`) which is
 * tolerant of the backend renaming `/contests/{id}/reminder` →
 * `/user-contests/{id}/reminder` → `/user/contests/{id}/reminder` over time.
 */
async function fetchFirstAvailable<T>(
  paths: string[],
  init: ServiceFetchInit = {}
): Promise<T> {
  let lastError: unknown = null;
  for (const path of paths) {
    try {
      return await serviceFetch<T>('competitions', path, init);
    } catch (error) {
      lastError = error;
      // Only fall through on 404 — other errors (401/500/network) propagate.
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
  host: 'codeforces' | 'leetcode' | 'atcoder' | 'nibras' | string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  url?: string;
  registered?: boolean;
  reminderSet?: boolean;
  bookmarked?: boolean;
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

export type LinkedAccount = {
  host: 'codeforces' | 'leetcode' | string;
  handle: string;
  verified: boolean;
  linkedAt?: string;
};

// ── Contests ────────────────────────────────────────────────────────────────
// `listContests` is anonymous in the legacy backend; matches `auth: false` so
// `/competitions` renders even before sign-in.
export async function listContests(filters: { upcoming?: boolean; host?: string } = {}) {
  return serviceFetch<Contest[]>('competitions', '/contests', {
    auth: false,
    query: filters as Record<string, string | boolean>,
  });
}

export async function setContestReminder(contestId: string, on: boolean) {
  return fetchFirstAvailable<{ reminderSet: boolean }>(
    [
      `/user-contests/${contestId}/reminder`,
      `/user/contests/${contestId}/reminder`,
      `/contests/user-contests/${contestId}/reminder`,
    ],
    { method: 'POST', auth: true, body: { on } }
  );
}

export async function setContestBookmark(contestId: string, on: boolean) {
  return fetchFirstAvailable<{ bookmarked: boolean }>(
    [
      `/user-contests/${contestId}/bookmark`,
      `/user/contests/${contestId}/bookmark`,
      `/contests/user-contests/${contestId}/bookmark`,
    ],
    { method: 'POST', auth: true, body: { on } }
  );
}

// ── Practice problems ───────────────────────────────────────────────────────
export async function listProblems(filters: {
  tag?: string;
  difficultyMin?: number;
  difficultyMax?: number;
  host?: string;
  q?: string;
  page?: number;
  limit?: number;
} = {}) {
  return serviceFetch<{ items: PracticeProblem[]; total: number }>(
    'competitions',
    '/problems',
    {
      auth: true,
      query: filters as Record<string, string | number>,
    }
  );
}

// Invented by the port: legacy dashboard doesn't expose problem bookmarks.
// Optional variant swallows 404 so the UI can hide the affordance silently.
// Returns the optimistic `on` value when the endpoint is unavailable so the
// caller can continue without crashing on `null`.
export async function setProblemBookmark(
  problemId: string,
  on: boolean
): Promise<{ bookmarked: boolean }> {
  const data = await serviceFetchOptional<{ bookmarked: boolean }>(
    'competitions',
    `/problems/${problemId}/bookmark`,
    {
      method: 'POST',
      auth: true,
      body: { on },
    }
  );
  return data ?? { bookmarked: on };
}

// ── Ranking ─────────────────────────────────────────────────────────────────
// Invented endpoint — degrades to empty list when backend returns 404.
export async function getRanking(host?: string): Promise<RankingEntry[]> {
  const data = await serviceFetchOptional<RankingEntry[]>('competitions', '/ranking', {
    auth: true,
    query: host ? { host } : undefined,
  });
  return data ?? [];
}

// ── History ─────────────────────────────────────────────────────────────────
export async function getMyHistory(host?: string): Promise<ContestHistoryEntry[]> {
  const query = host ? { host } : undefined;
  for (const path of ['/contests/user-contests/history', '/user-contests/history']) {
    const data = await serviceFetchOptional<ContestHistoryEntry[]>('competitions', path, {
      auth: true,
      query,
    });
    if (data) return data;
  }
  return [];
}

// ── Linked accounts ─────────────────────────────────────────────────────────
// Legacy backend has no GET list endpoint — only verify-flow POSTs. Degrade
// to empty so the chips section just renders empty.
export async function getLinkedAccounts(): Promise<LinkedAccount[]> {
  const data = await serviceFetchOptional<LinkedAccount[]>(
    'competitions',
    '/contests/accounts',
    { auth: true }
  );
  return data ?? [];
}

export async function linkAccount(payload: { host: string; handle: string; token?: string }) {
  return serviceFetch<LinkedAccount>('competitions', '/contests/accounts/link', {
    method: 'POST',
    auth: true,
    // Legacy contract uses `platform`, not `host`.
    body: {
      platform: payload.host,
      handle: payload.handle,
      ...(payload.token ? { token: payload.token } : {}),
    },
  });
}

// Invented by the port: legacy dashboard has no unlink endpoint.
export async function unlinkAccount(host: string): Promise<{ unlinked: true } | null> {
  return serviceFetchOptional<{ unlinked: true }>(
    'competitions',
    `/contests/accounts/${host}`,
    {
      method: 'DELETE',
      auth: true,
    }
  );
}
