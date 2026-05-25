import type { DashboardMode, TrackingActivityEvent } from '@nibras/contracts';
import { formatHoursMinutes, formatShortDate } from '../../../lib/utils';

export type DashboardAction = { label: string; href: string };

export function getDisplayName(username?: string | null, displayName?: string | null): string {
  if (displayName?.trim()) return displayName.trim();
  if (!username) return 'there';
  return username
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'No timestamp available';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatWaitingTime(value: number | null): string {
  return value == null ? 'No pending queue' : formatHoursMinutes(value);
}

export function actionSummaryLabel(mode: DashboardMode): string {
  return mode === 'student' ? 'Student workspace' : 'Instructor workspace';
}

export function uniqueActions(
  actions: Array<DashboardAction | null | undefined>
): DashboardAction[] {
  const seen = new Set<string>();
  const result: DashboardAction[] = [];
  for (const action of actions) {
    if (!action || !action.href || !action.label) continue;
    const key = `${action.href}::${action.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(action);
  }
  return result;
}

export function activityHref(event: TrackingActivityEvent): string | null {
  if (event.submissionId) return `/submissions/${event.submissionId}`;
  if (event.projectId && event.courseId) return `/projects?courseId=${event.courseId}`;
  if (event.courseId) return `/projects?courseId=${event.courseId}`;
  return null;
}

export function deadlineToneClass(
  dueAt: string | null,
  status: string,
  styles: Record<string, string>
): string {
  if (status === 'approved' || status === 'graded') return styles.toneSuccess;
  const dueMinutes = dueAt ? (new Date(dueAt).getTime() - Date.now()) / 60_000 : null;
  if (dueMinutes !== null && dueMinutes < 0) return styles.toneDanger;
  if (dueMinutes !== null && dueMinutes <= 48 * 60) return styles.toneWarning;
  return styles.toneNeutral;
}

export function deadlineDueLabel(dueAt: string | null): string {
  if (!dueAt) return 'No due date';
  const dueMinutes = (new Date(dueAt).getTime() - Date.now()) / 60_000;
  if (dueMinutes < 0) return `Overdue by ${formatHoursMinutes(dueMinutes)}`;
  if (dueMinutes === 0) return 'Due now';
  return `Due ${formatShortDate(dueAt)}`;
}
