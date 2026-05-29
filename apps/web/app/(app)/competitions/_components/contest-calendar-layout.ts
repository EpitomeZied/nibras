import { contestDurationMinutes } from '../../../lib/contest-duration';
import type { Contest } from '../../../lib/services/competitions';

export const PX_PER_HOUR = 48;
export const HOURS_IN_DAY = 24;
export const TIME_GRID_HEIGHT_PX = PX_PER_HOUR * HOURS_IN_DAY;
export const MIN_BLOCK_HEIGHT_PX = 18;

export function minutesFromMidnight(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function contestTopPx(startsAt: string, pxPerHour = PX_PER_HOUR): number {
  return (minutesFromMidnight(startsAt) / 60) * pxPerHour;
}

export function contestHeightPx(
  durationMinutes: number,
  pxPerHour = PX_PER_HOUR,
  minHeight = MIN_BLOCK_HEIGHT_PX
): number {
  return Math.max(minHeight, (durationMinutes / 60) * pxPerHour);
}

/** Clip multi-day contests to the portion visible on the start day column. */
export function contestDisplayMinutesOnDay(
  contest: Pick<Contest, 'startsAt' | 'endsAt' | 'durationMinutes'>
): number {
  const total = contestDurationMinutes(contest);
  const fromMidnight = minutesFromMidnight(contest.startsAt);
  const maxInDay = HOURS_IN_DAY * 60 - fromMidnight;
  return Math.min(total, Math.max(1, maxInDay));
}

export function contestBlockStyle(
  contest: Pick<Contest, 'startsAt' | 'endsAt' | 'durationMinutes'>,
  pxPerHour = PX_PER_HOUR
): { top: number; height: number } {
  const displayMinutes = contestDisplayMinutesOnDay(contest);
  return {
    top: contestTopPx(contest.startsAt, pxPerHour),
    height: contestHeightPx(displayMinutes, pxPerHour),
  };
}
