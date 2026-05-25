import { getAchievementsDashboard } from '../../lib/services/gamification';

export async function loadDashboardData({ fetchJson, mode }) {
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : '';
  return await fetchJson(`/v1/tracking/dashboard/home${query}`, {
    auth: true,
  });
}

export async function loadDashboardActivity(fetchJson) {
  const payload = await fetchJson('/v1/tracking/activity', { auth: true });
  return Array.isArray(payload) ? payload : [];
}

export async function loadDashboardSupplements(fetchJson) {
  const [activityResult, achievementsResult] = await Promise.allSettled([
    loadDashboardActivity(fetchJson),
    getAchievementsDashboard(),
  ]);

  return {
    activity: activityResult.status === 'fulfilled' ? activityResult.value : [],
    achievements: achievementsResult.status === 'fulfilled' ? achievementsResult.value : null,
  };
}
