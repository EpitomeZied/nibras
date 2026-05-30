export function getUserToday(timezone: string): string {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const y = parts.find((p) => p.type === 'year')!.value;
    const m = parts.find((p) => p.type === 'month')!.value;
    const d = parts.find((p) => p.type === 'day')!.value;
    return `${y}-${m}-${d}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function getUserYesterday(timezone: string): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(yesterday);
    const y = parts.find((p) => p.type === 'year')!.value;
    const m = parts.find((p) => p.type === 'month')!.value;
    const d = parts.find((p) => p.type === 'day')!.value;
    return `${y}-${m}-${d}`;
  } catch {
    return yesterday.toISOString().slice(0, 10);
  }
}

export function isConsecutiveDay(earlier: string, later: string): boolean {
  const d1 = new Date(earlier + 'T00:00:00Z');
  const d2 = new Date(later + 'T00:00:00Z');
  const diffMs = d2.getTime() - d1.getTime();
  return diffMs === 24 * 60 * 60 * 1000;
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

/** Tier markers stored in difficultyPref: 1000=easy, 1800=medium, 3000=hard */
export const DIFFICULTY_TIER_EASY = 1000;
export const DIFFICULTY_TIER_MEDIUM = 1800;
export const DIFFICULTY_TIER_HARD = 3000;

export function difficultyTiersToPref(tiers: Array<'easy' | 'medium' | 'hard'>): number[] {
  const map = {
    easy: DIFFICULTY_TIER_EASY,
    medium: DIFFICULTY_TIER_MEDIUM,
    hard: DIFFICULTY_TIER_HARD,
  };
  return tiers.map((t) => map[t]);
}

export function difficultyPrefToTiers(prefs: number[]): Array<'easy' | 'medium' | 'hard'> {
  const tiers: Array<'easy' | 'medium' | 'hard'> = [];
  if (prefs.some((p) => p <= 1000)) tiers.push('easy');
  if (prefs.some((p) => p > 1000 && p <= 1800)) tiers.push('medium');
  if (prefs.some((p) => p > 1800)) tiers.push('hard');
  return tiers;
}
