import type { DashboardHomeResponse, DashboardMode, TrackingActivityEvent } from '@nibras/contracts';
import type { AchievementsDashboard } from '../../lib/services/gamification';
import { getAchievementsDashboard } from '../../lib/services/gamification';

type FetchJson = (path: string, init?: RequestInit & { auth?: boolean }) => Promise<unknown>;

export type DashboardSupplements = {
  activity: TrackingActivityEvent[];
  achievements: AchievementsDashboard | null;
};

export async function loadDashboardData({
  fetchJson,
  mode,
}: {
  fetchJson: FetchJson;
  mode?: DashboardMode;
}): Promise<DashboardHomeResponse> {
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : '';
  return (await fetchJson(`/v1/tracking/dashboard/home${query}`, {
    auth: true,
  })) as DashboardHomeResponse;
}

export async function loadDashboardActivity(fetchJson: FetchJson): Promise<TrackingActivityEvent[]> {
  const payload = await fetchJson('/v1/tracking/activity', { auth: true });
  return Array.isArray(payload) ? (payload as TrackingActivityEvent[]) : [];
}

export async function loadDashboardSupplements(fetchJson: FetchJson): Promise<DashboardSupplements> {
  const [activityResult, achievementsResult] = await Promise.allSettled([
    loadDashboardActivity(fetchJson),
    getAchievementsDashboard(),
  ]);

  return {
    activity: activityResult.status === 'fulfilled' ? activityResult.value : [],
    achievements: achievementsResult.status === 'fulfilled' ? achievementsResult.value : null,
  };
}
