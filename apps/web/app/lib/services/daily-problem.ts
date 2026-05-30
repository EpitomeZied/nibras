import type {
  DailyConfigResponse,
  DailyHistoryResponse,
  DailyLeaderboardResponse,
  DailySolveResponse,
  DailyStatsResponse,
  DailyTagsResponse,
  DailyTodayResponse,
  DailyVerifyResponse,
} from '@nibras/contracts';
import { serviceFetch } from '../api-clients/service-fetch';

export type {
  DailyConfigResponse,
  DailyHistoryResponse,
  DailyLeaderboardResponse,
  DailySolveResponse,
  DailyStatsResponse,
  DailyTagsResponse,
  DailyTodayResponse,
  DailyVerifyResponse,
};

export async function getDailyToday(): Promise<DailyTodayResponse> {
  return serviceFetch<DailyTodayResponse>('competitions', '/v1/daily-problem/today');
}

export async function getDailyStats(): Promise<DailyStatsResponse> {
  return serviceFetch<DailyStatsResponse>('competitions', '/v1/daily-problem/stats');
}

export async function getDailyHistory(page = 1, limit = 20): Promise<DailyHistoryResponse> {
  return serviceFetch<DailyHistoryResponse>('competitions', '/v1/daily-problem/history', {
    query: { page, limit },
  });
}

export async function getDailyConfig(): Promise<DailyConfigResponse> {
  return serviceFetch<DailyConfigResponse>('competitions', '/v1/daily-problem/config');
}

export async function getDailyTags(): Promise<DailyTagsResponse> {
  return serviceFetch<DailyTagsResponse>('competitions', '/v1/daily-problem/tags');
}

export async function getDailyLeaderboard(limit = 50): Promise<DailyLeaderboardResponse> {
  return serviceFetch<DailyLeaderboardResponse>('competitions', '/v1/daily-problem/leaderboard', {
    query: { limit },
  });
}

export async function patchDailyConfig(
  body: Partial<Pick<DailyConfigResponse, 'enabled' | 'difficultyPref' | 'tagPrefs' | 'timezone'>>
): Promise<DailyConfigResponse> {
  return serviceFetch<DailyConfigResponse>('competitions', '/v1/daily-problem/config', {
    method: 'PATCH',
    body,
  });
}

export async function solveDailyToday(): Promise<DailySolveResponse> {
  return serviceFetch<DailySolveResponse>('competitions', '/v1/daily-problem/today/solve', {
    method: 'POST',
  });
}

export async function skipDailyToday(): Promise<{ success: boolean; freezesLeft?: number }> {
  return serviceFetch('competitions', '/v1/daily-problem/today/skip', { method: 'POST' });
}

export async function verifyDailyToday(): Promise<DailyVerifyResponse> {
  return serviceFetch<DailyVerifyResponse>('competitions', '/v1/daily-problem/today/verify', {
    method: 'POST',
  });
}

export async function pauseDailyProblems(days: number): Promise<{ pausedUntil: string }> {
  return serviceFetch('competitions', '/v1/daily-problem/pause', {
    method: 'POST',
    body: { days },
  });
}

export async function resumeDailyProblems(): Promise<{ ok: boolean }> {
  return serviceFetch('competitions', '/v1/daily-problem/resume', { method: 'POST' });
}

export function formatResetCountdown(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function msUntilMidnight(timezone: string): number {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const nowParts = formatter.formatToParts(now);
    const hour = Number(nowParts.find((p) => p.type === 'hour')?.value ?? 0);
    const minute = Number(nowParts.find((p) => p.type === 'minute')?.value ?? 0);
    const second = Number(nowParts.find((p) => p.type === 'second')?.value ?? 0);
    const elapsedMs = ((hour * 60 + minute) * 60 + second) * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.max(0, dayMs - elapsedMs);
  } catch {
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }
}

export function difficultyLabel(d: number): string {
  if (d <= 1000) return 'Easy';
  if (d <= 1800) return 'Medium';
  return 'Hard';
}

export function difficultyClassName(
  d: number,
  styles: { badgeEasy: string; badgeMedium: string; badgeHard: string }
): string {
  if (d <= 1000) return styles.badgeEasy;
  if (d <= 1800) return styles.badgeMedium;
  return styles.badgeHard;
}

export const DIFFICULTY_TIERS = [
  { id: 'easy' as const, label: 'Easy', value: 1000 },
  { id: 'medium' as const, label: 'Medium', value: 1800 },
  { id: 'hard' as const, label: 'Hard', value: 3000 },
];

export function tiersFromPref(prefs: number[]): Array<'easy' | 'medium' | 'hard'> {
  const tiers: Array<'easy' | 'medium' | 'hard'> = [];
  if (prefs.some((p) => p <= 1000)) tiers.push('easy');
  if (prefs.some((p) => p > 1000 && p <= 1800)) tiers.push('medium');
  if (prefs.some((p) => p > 1800)) tiers.push('hard');
  return tiers;
}

export function prefFromTiers(tiers: Array<'easy' | 'medium' | 'hard'>): number[] {
  const map = { easy: 1000, medium: 1800, hard: 3000 };
  return tiers.map((t) => map[t]);
}

export function historyStatus(item: {
  solved: boolean;
  skipped: boolean;
  missedAt?: string;
}): 'Solved' | 'Skipped' | 'Missed' | 'Pending' {
  if (item.solved) return 'Solved';
  if (item.skipped) return 'Skipped';
  if (item.missedAt) return 'Missed';
  return 'Pending';
}

export function buildDailyDiscussHref(assignedDate: string, title: string): string {
  const params = new URLSearchParams({
    tags: 'daily-problem',
    q: `Daily ${assignedDate}: ${title}`,
  });
  return `/community/discussions?${params}`;
}
