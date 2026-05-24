import { getCachedProblemset, getUserCfData, problemKey, problemUrl } from './cf-api';
import type { PracticeCfProblemRow, PracticeCfProblemsQuery } from './types';
import { processCfSubmissions } from './cf-analytics';
import type { CfAnalyticsPayload } from './types';

function matchesQuery(
  p: { name: string; tags: string[]; rating?: number; contestId?: number },
  query: PracticeCfProblemsQuery
): boolean {
  if (query.q?.trim()) {
    const q = query.q.trim().toLowerCase();
    if (!p.name.toLowerCase().includes(q)) return false;
  }
  if (query.tag?.trim()) {
    const tag = query.tag.trim().toLowerCase();
    if (!p.tags.some((t) => t.toLowerCase() === tag)) return false;
  }
  if (query.ratingMin !== undefined && (p.rating ?? 0) < query.ratingMin) return false;
  if (query.ratingMax !== undefined && (p.rating ?? 0) > query.ratingMax) return false;
  if (query.contestIdMin !== undefined) {
    const cid = p.contestId ?? 0;
    if (cid < query.contestIdMin) return false;
  }
  if (query.contestIdMax !== undefined) {
    const cid = p.contestId ?? 0;
    if (cid > query.contestIdMax) return false;
  }
  return true;
}

export async function fetchPracticeCfProblems(
  handle: string | undefined,
  query: PracticeCfProblemsQuery
): Promise<{
  items: PracticeCfProblemRow[];
  total: number;
  solvedCount: number;
  page: number;
  limit: number;
}> {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(200, Math.max(1, query.limit ?? 100));

  const { problems, solvedCountByKey } = await getCachedProblemset();
  const { statusMap } = await getUserCfData(handle);

  let solvedCount = 0;
  for (const p of problems) {
    const key = problemKey(p);
    if (statusMap.get(key)?.solved) solvedCount++;
  }

  const rows: PracticeCfProblemRow[] = [];

  for (const p of problems) {
    const key = problemKey(p);
    const st = statusMap.get(key);
    const solved = st?.solved ?? false;
    const attempted = st?.attempted ?? false;

    if (query.solved === 'true' && !solved) continue;
    if (query.solved === 'false' && solved) continue;
    if (!matchesQuery({ ...p, contestId: p.contestId }, query)) continue;

    rows.push({
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
    });
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  const items = rows.slice(start, start + limit);

  return { items, total, solvedCount, page, limit };
}

export async function fetchPracticeCfAnalytics(handle: string): Promise<CfAnalyticsPayload> {
  const { submissions } = await getUserCfData(handle);
  return processCfSubmissions(submissions);
}
