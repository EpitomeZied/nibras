import { serviceFetch } from '../api-clients/service-fetch';

export type Badge = {
  id: string;
  code: string;
  name: string;
  description?: string;
  iconUrl?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
  earnedAt?: string;
  progress?: number;
  threshold?: number;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  delta?: number;
  badges?: number;
  level?: number;
};

export type LeaderboardFilters = {
  period?: 'all' | 'month' | 'week' | 'today';
  scope?: 'global' | 'course' | 'cohort';
  courseId?: string;
  page?: number;
  limit?: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  config?: { period?: string; scope?: string };
};

export type LeaderboardConfig = {
  periods: Array<{ value: string; label: string }>;
  scopes: Array<{ value: string; label: string }>;
};

export type MyRank = {
  rank: number | null;
  score: number;
  delta?: number;
  level?: number;
  badges?: number;
};

export type AchievementsDashboard = {
  badges: Badge[];
  reputation: import('./reputation').MyReputation;
  newlyAwarded: Badge[];
};

export type AchievementsDashboardOptions = {
  sync?: boolean;
};

const DASHBOARD_CACHE_MS = 15_000;
let dashboardCache: { data: AchievementsDashboard; at: number } | null = null;

export function clearAchievementsDashboardCache(): void {
  dashboardCache = null;
}

export function peekAchievementsDashboardCache(): AchievementsDashboard | null {
  if (dashboardCache && Date.now() - dashboardCache.at < DASHBOARD_CACHE_MS) {
    return dashboardCache.data;
  }
  return null;
}

export async function getAchievementsDashboard(
  force = false,
  opts: AchievementsDashboardOptions = {}
): Promise<AchievementsDashboard> {
  if (!force && dashboardCache && Date.now() - dashboardCache.at < DASHBOARD_CACHE_MS) {
    return dashboardCache.data;
  }
  const query: Record<string, string> = {};
  if (opts.sync) query.sync = 'true';
  const data = await serviceFetch<AchievementsDashboard>(
    'admin',
    '/v1/gamification/achievements-dashboard',
    { auth: true, query: Object.keys(query).length > 0 ? query : undefined }
  );
  dashboardCache = { data, at: Date.now() };
  return data;
}

export async function getAllBadges(): Promise<Badge[]> {
  const data = await serviceFetch<Badge[] | { badges: Badge[] }>(
    'admin',
    '/v1/gamification/all-badges',
    { auth: true }
  );
  if (Array.isArray(data)) return data;
  return data?.badges ?? [];
}

export async function checkAwardBadges(studentId?: string): Promise<Badge[]> {
  const data = await serviceFetch<Badge[] | { awarded: Badge[] }>(
    'admin',
    '/v1/gamification/check-award',
    {
      method: 'POST',
      auth: true,
      body: studentId ? { studentId } : {},
    }
  );
  if (Array.isArray(data)) return data;
  return data?.awarded ?? [];
}

export async function getLeaderboard(
  filters: LeaderboardFilters = {}
): Promise<LeaderboardResponse> {
  const query: Record<string, string | number | undefined> = {};
  if (filters.period) query.period = filters.period;
  if (filters.scope) query.scope = filters.scope;
  if (filters.courseId) query.courseId = filters.courseId;
  if (filters.page) query.page = filters.page;
  if (filters.limit) query.limit = filters.limit;
  return serviceFetch<LeaderboardResponse>('admin', '/v1/gamification/leaderboards', {
    auth: true,
    query,
  });
}

export async function getMyLeaderboardRank(
  filters: Omit<LeaderboardFilters, 'page' | 'limit'> = {}
): Promise<MyRank> {
  const query: Record<string, string | undefined> = {};
  if (filters.period) query.period = filters.period;
  if (filters.scope) query.scope = filters.scope;
  if (filters.courseId) query.courseId = filters.courseId;
  return serviceFetch<MyRank>('admin', '/v1/gamification/leaderboards/me', {
    auth: true,
    query,
  });
}

export async function getLeaderboardConfig(): Promise<LeaderboardConfig> {
  return serviceFetch<LeaderboardConfig>('admin', '/v1/gamification/leaderboards/config', {
    auth: true,
  });
}
