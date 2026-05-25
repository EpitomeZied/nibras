import type { DashboardHomeResponse, DashboardMode } from '@nibras/contracts';
import type { AchievementsDashboard } from '../../lib/services/gamification';
import { getAchievementsDashboard } from '../../lib/services/gamification';

type FetchJson = (path: string, init?: RequestInit & { auth?: boolean }) => Promise<unknown>;

export type DashboardSupplements = {
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

export async function loadDashboardSupplements(
  _fetchJson: FetchJson
): Promise<DashboardSupplements> {
  const achievementsResult = await Promise.allSettled([getAchievementsDashboard()]);

  return {
    achievements: achievementsResult[0].status === 'fulfilled' ? achievementsResult[0].value : null,
  };
}
