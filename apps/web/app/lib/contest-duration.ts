import type { Contest } from './services/competitions';

export function contestDurationMinutes(
  contest: Pick<Contest, 'startsAt' | 'endsAt' | 'durationMinutes'>
): number {
  try {
    const start = new Date(contest.startsAt).getTime();
    const end = new Date(contest.endsAt).getTime();
    const computed = Math.round((end - start) / 60000);
    if (computed > 0) return computed;
  } catch {
    /* ignore */
  }
  return contest.durationMinutes > 0 ? contest.durationMinutes : 1;
}

export function formatContestDuration(
  contest: Pick<Contest, 'startsAt' | 'endsAt' | 'durationMinutes'>
): string {
  const mins = contestDurationMinutes(contest);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} min`;
}
