import { rateLimited } from './rate-limiter';
import type { PlatformFetcher, RawContest } from './types';

const BASE = 'https://ctftime.org/api/v1';
const DELAY_MS = 1500;

type CtfEvent = {
  id: number;
  title: string;
  url: string;
  start: string;
  finish: string;
  format?: string;
  weight?: number;
  description?: string;
  organizers?: Array<{ name?: string }>;
};

async function ctfGet<T>(path: string): Promise<T> {
  return rateLimited('ctftime', DELAY_MS, async () => {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Nibras-Platform/1.0' },
    });
    if (!res.ok) throw new Error(`CTFtime API ${res.status}: ${res.statusText}`);
    return (await res.json()) as T;
  });
}

function toContest(event: CtfEvent): RawContest {
  const startsAt = new Date(event.start);
  const endsAt = new Date(event.finish);
  const durationMinutes = Math.max(
    1,
    Math.round((endsAt.getTime() - startsAt.getTime()) / 60000)
  );
  const url = event.url.startsWith('http') ? event.url : `https://ctftime.org${event.url}`;
  return {
    platformContestId: String(event.id),
    name: event.title,
    url,
    startsAt,
    endsAt,
    durationMinutes,
    phase: endsAt.getTime() < Date.now() ? 'FINISHED' : startsAt.getTime() > Date.now() ? 'BEFORE' : 'RUNNING',
    tags: ['ctf', event.format ?? 'jeopardy'].filter(Boolean),
  };
}

export const ctftimeFetcher: PlatformFetcher = {
  async fetchContests(): Promise<RawContest[]> {
    const now = new Date();
    const from = Math.floor(now.getTime() / 1000) - 7 * 24 * 3600;
    const to = from + 90 * 24 * 3600;
    const events = await ctfGet<CtfEvent[]>(`/events/?limit=100&start=${from}&finish=${to}`);
    return events.map(toContest);
  },

  async fetchProblems() {
    return [];
  },

  async verifyHandle(handle: string) {
    try {
      const teams = await ctfGet<Array<{ name?: string }>>(`/teams/?limit=5&query=${encodeURIComponent(handle)}`);
      const match = teams.some((t) => t.name?.toLowerCase() === handle.toLowerCase());
      return { valid: match };
    } catch {
      return { valid: false };
    }
  },

  async fetchUserStats() {
    return { rating: 0, maxRating: 0, contestHistory: [], solvedProblemIds: [] };
  },
};
