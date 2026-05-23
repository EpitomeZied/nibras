import { rateLimited } from '../fetchers/rate-limiter';
import type { CodehuntProblemRow } from './types';

const CF_BASE = 'https://codeforces.com/api';
const DELAY_MS = 2000;
const LAST_CONTESTS = 1000;

type CfResponse<T> = { status: 'OK'; result: T } | { status: 'FAILED'; comment: string };

type CfProblem = {
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
};

type CfProblemset = {
  problems: CfProblem[];
  problemStatistics: Array<{ contestId?: number; index: string; solvedCount: number }>;
};

type CfContest = {
  id: number;
  startTimeSeconds?: number;
};

type CfSubmission = {
  problem: CfProblem;
  verdict?: string;
};

async function cfGet<T>(path: string): Promise<T> {
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

function problemKey(p: CfProblem): string {
  return p.contestId ? `${p.contestId}${p.index}` : p.index;
}

function problemUrl(p: CfProblem): string {
  if (p.contestId) {
    return `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`;
  }
  return `https://codeforces.com/problemset/problem/0/${p.index}`;
}

async function loadUserCfStatus(
  handle: string | undefined
): Promise<Map<string, { solved: boolean; attempted: boolean }>> {
  const status = new Map<string, { solved: boolean; attempted: boolean }>();
  if (!handle?.trim()) return status;

  const submissions = await cfGet<CfSubmission[]>(
    `/user.status?handle=${encodeURIComponent(handle.trim())}&from=1&count=10000`
  );

  for (const sub of submissions) {
    const key = problemKey(sub.problem);
    const entry = status.get(key) ?? { solved: false, attempted: false };
    if (sub.verdict === 'OK') entry.solved = true;
    if (sub.verdict) entry.attempted = true;
    status.set(key, entry);
  }
  return status;
}

export async function fetchCodeforcesCodehuntProblems(
  handle?: string
): Promise<{ items: CodehuntProblemRow[]; solvedCount: number }> {
  const [contests, problemset] = await Promise.all([
    cfGet<CfContest[]>('/contest.list'),
    cfGet<CfProblemset>('/problemset.problems'),
  ]);

  const contestIds = contests
    .map((c) => c.id)
    .filter((id) => Number.isFinite(id))
    .sort((a, b) => b - a);
  const recentContestIds = new Set(contestIds.slice(0, LAST_CONTESTS));
  const minContestId =
    contestIds.length > 0 ? Math.min(...contestIds.slice(0, LAST_CONTESTS)) : 0;

  const solvedCountByKey = new Map<string, number>();
  for (const stat of problemset.problemStatistics) {
    if (!stat.contestId) continue;
    solvedCountByKey.set(`${stat.contestId}${stat.index}`, stat.solvedCount);
  }

  const filtered = problemset.problems.filter(
    (p) => p.contestId !== undefined && p.contestId >= minContestId && recentContestIds.has(p.contestId)
  );

  filtered.sort((a, b) => {
    const ac = a.contestId ?? 0;
    const bc = b.contestId ?? 0;
    if (bc !== ac) return bc - ac;
    return b.index.localeCompare(a.index);
  });

  const userStatus = await loadUserCfStatus(handle);
  let solvedCount = 0;

  const items: CodehuntProblemRow[] = filtered.map((p) => {
    const key = problemKey(p);
    const st = userStatus.get(key);
    const solved = st?.solved ?? false;
    const attempted = st?.attempted ?? false;
    if (solved) solvedCount++;
    return {
      problemId: key,
      index: p.index,
      name: p.name,
      url: problemUrl(p),
      solved,
      attempted,
      rating: p.rating ?? 0,
      tags: p.tags,
      contestId: p.contestId ? String(p.contestId) : undefined,
      solvedCount: solvedCountByKey.get(key),
    };
  });

  return { items, solvedCount };
}
