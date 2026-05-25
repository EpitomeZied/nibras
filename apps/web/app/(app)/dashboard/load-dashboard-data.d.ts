import type {
  DashboardHomeResponse,
  DashboardMode,
  TrackingActivityEvent,
} from '@nibras/contracts';
import type { AchievementsDashboard } from '../../lib/services/gamification';

export type DashboardSupplements = {
  activity: TrackingActivityEvent[];
  achievements: AchievementsDashboard | null;
};

export function loadDashboardData(args: {
  fetchJson: (path: string, init?: RequestInit & { auth?: boolean }) => Promise<unknown>;
  mode?: DashboardMode;
}): Promise<DashboardHomeResponse>;

export function loadDashboardActivity(
  fetchJson: (path: string, init?: RequestInit & { auth?: boolean }) => Promise<unknown>
): Promise<TrackingActivityEvent[]>;

export function loadDashboardSupplements(
  fetchJson: (path: string, init?: RequestInit & { auth?: boolean }) => Promise<unknown>
): Promise<DashboardSupplements>;
