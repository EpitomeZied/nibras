import { rateLimited } from '../../fetchers/rate-limiter';

const CF_BASE = 'https://codeforces.com/api';
const DELAY_MS = 2000;
const PROBLEMSET_TTL_MS = 60 * 60 * 1000;
const STATUS_TTL_MS = 15 * 60 * 1000;
const STATUS_PAGE_SIZE = 10000;

type CfResponse<T> = { status: 'OK'; result: T } | { status: 'FAILED'; comment: string };

export type CfProblem = {
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  points?: number;
};

export type CfSubmission = {
  creationTimeSeconds: number;
  relativeTimeSeconds?: number;
  verdict?: string;
  programmingLanguage?: string;
  timeConsumedMillis?: number;
  memoryConsumedBytes?: number;
  problem: CfProblem;
  author?: { participantType?: string };
};

type CfProblemset = {
  problems: CfProblem[];
  problemStatistics: Array<{ contestId?: number; index: string; solvedCount: number }>;
};

type CachedProblemset = {
  problems: CfProblem[];
  solvedCountByKey: Map<string, number>;
  expiresAt: number;
};

const statusCache = new Map<
  string,
  { submissions: CfSubmission[]; statusMap: Map<string, { solved: boolean; attempted: boolean }>; expiresAt: number }
>();

let problemsetCache: CachedProblemset | null = null;

export async function cfGet<T>(path: string): Promise<T> {
  return rateLimited('codeforces', DELAY_MS, async () => {
    const res = await fetch(`${CF_BASE}${path}`);
    if (!res.ok) throw new Error(`Codeforces API ${res.status}: ${res.statusText}`);
    const json = (await res.json()) as CfResponse<T>;
    if (json.status !== 'OK') {
      throw new Error(`Codeforces API error: ${(json as { comment: string }).comment}`);
    }
    return json.result;
  });
}

export function problemKey(p: CfProblem): string {
  return p.contestId ? `${p.contestId}${p.index}` : p.index;
}

export function problemUrl(p: CfProblem): string {
  if (p.contestId) {
    return `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
  }
  return `https://codeforces.com/problemset/problem/0/${p.index}`;
}

export async function getCachedProblemset(): Promise<CachedProblemset> {
  const now = Date.now();
  if (problemsetCache && problemsetCache.expiresAt > now) {
    return problemsetCache;
  }

  const problemset = await cfGet<CfProblemset>('/problemset.problems');
  const solvedCountByKey = new Map<string, number>();
  for (const stat of problemset.problemStatistics) {
    if (!stat.contestId) continue;
    solvedCountByKey.set(`${stat.contestId}${stat.index}`, stat.solvedCount);
  }

  const problems = problemset.problems
    .filter((p) => p.contestId !== undefined)
    .sort((a, b) => {
      const ac = a.contestId ?? 0;
      const bc = b.contestId ?? 0;
      if (bc !== ac) return bc - ac;
      return b.index.localeCompare(a.index);
    });

  problemsetCache = {
    problems,
    solvedCountByKey,
    expiresAt: now + PROBLEMSET_TTL_MS,
  };
  return problemsetCache;
}

async function fetchAllSubmissions(handle: string): Promise<CfSubmission[]> {
  const trimmed = handle.trim();
  const all: CfSubmission[] = [];
  for (let from = 1; ; from += STATUS_PAGE_SIZE) {
    const batch = await cfGet<CfSubmission[]>(
      `/user.status?handle=${encodeURIComponent(trimmed)}&from=${from}&count=${STATUS_PAGE_SIZE}`
    );
    all.push(...batch);
    if (batch.length < STATUS_PAGE_SIZE) break;
  }
  return all;
}

export async function getUserCfData(handle: string | undefined): Promise<{
  submissions: CfSubmission[];
  statusMap: Map<string, { solved: boolean; attempted: boolean }>;
}> {
  if (!handle?.trim()) {
    return { submissions: [], statusMap: new Map() };
  }

  const key = handle.trim().toLowerCase();
  const now = Date.now();
  const cached = statusCache.get(key);
  if (cached && cached.expiresAt > now) {
    return { submissions: cached.submissions, statusMap: cached.statusMap };
  }

  const submissions = await fetchAllSubmissions(handle);
  const statusMap = new Map<string, { solved: boolean; attempted: boolean }>();
  for (const sub of submissions) {
    const pk = problemKey(sub.problem);
    const entry = statusMap.get(pk) ?? { solved: false, attempted: false };
    if (sub.verdict === 'OK') entry.solved = true;
    if (sub.verdict) entry.attempted = true;
    statusMap.set(pk, entry);
  }

  statusCache.set(key, {
    submissions,
    statusMap,
    expiresAt: now + STATUS_TTL_MS,
  });
  return { submissions, statusMap };
}
