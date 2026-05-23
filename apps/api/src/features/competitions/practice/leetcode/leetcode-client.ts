import { PrismaClient } from '@prisma/client';
import {
  DIFFICULTY_SCORE,
  getCachedLcProblemset,
  getLcUserStatus,
  fetchLcUserProfile,
  questionUrl,
} from './lc-api';
import { processLcProfile } from './lc-analytics';
import type { LcAnalyticsPayload, PracticeLcProblemRow, PracticeLcProblemsQuery } from './types';

function matchesQuery(
  p: { title: string; tags: string[]; difficulty: string },
  query: PracticeLcProblemsQuery
): boolean {
  if (query.q?.trim()) {
    const q = query.q.trim().toLowerCase();
    if (!p.title.toLowerCase().includes(q)) return false;
  }
  if (query.tag?.trim()) {
    const tag = query.tag.trim().toLowerCase();
    if (!p.tags.some((t) => t.toLowerCase() === tag)) return false;
  }
  if (query.difficulty) {
    const label = query.difficulty === 'easy' ? 'Easy' : query.difficulty === 'medium' ? 'Medium' : 'Hard';
    if (p.difficulty !== label) return false;
  }
  return true;
}

async function loadDbSolvedSlugs(
  prisma: PrismaClient,
  userId: string | undefined
): Promise<Map<string, { solved: boolean; attempted: boolean }>> {
  const map = new Map<string, { solved: boolean; attempted: boolean }>();
  if (!userId) return map;

  const progress = await prisma.userProblemProgress.findMany({
    where: { userId, problem: { platform: 'leetcode' } },
    select: {
      solved: true,
      problem: { select: { platformProblemId: true } },
    },
  });

  for (const row of progress) {
    const slug = row.problem.platformProblemId;
    const existing = map.get(slug) ?? { solved: false, attempted: false };
    if (row.solved) existing.solved = true;
    existing.attempted = true;
    map.set(slug, existing);
  }
  return map;
}

export async function fetchPracticeLcProblems(
  handle: string | undefined,
  userId: string | undefined,
  prisma: PrismaClient,
  query: PracticeLcProblemsQuery
): Promise<{
  items: PracticeLcProblemRow[];
  total: number;
  solvedCount: number;
  page: number;
  limit: number;
}> {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(200, Math.max(1, query.limit ?? 100));

  const problems = await getCachedLcProblemset();
  const [lcStatus, dbStatus] = await Promise.all([
    getLcUserStatus(handle),
    loadDbSolvedSlugs(prisma, userId),
  ]);

  const mergeStatus = (slug: string) => {
    const lc = lcStatus.get(slug);
    const db = dbStatus.get(slug);
    return {
      solved: (lc?.solved ?? false) || (db?.solved ?? false),
      attempted: (lc?.attempted ?? false) || (db?.attempted ?? false),
    };
  };

  let solvedCount = 0;
  for (const p of problems) {
    if (mergeStatus(p.titleSlug).solved) solvedCount++;
  }

  const rows: PracticeLcProblemRow[] = [];
  for (const p of problems) {
    const st = mergeStatus(p.titleSlug);
    if (query.solved === 'true' && !st.solved) continue;
    if (query.solved === 'false' && st.solved) continue;
    if (!matchesQuery(p, query)) continue;

    rows.push({
      problemId: p.titleSlug,
      index: p.frontendQuestionId ?? p.titleSlug,
      name: p.title,
      url: questionUrl(p.titleSlug),
      solved: st.solved,
      attempted: st.attempted,
      rating: DIFFICULTY_SCORE[p.difficulty] ?? 0,
      difficultyLabel: p.difficulty,
      tags: p.tags,
      acRate: p.acRate,
    });
  }

  const total = rows.length;
  const start = (page - 1) * limit;
  const items = rows.slice(start, start + limit);

  return { items, total, solvedCount, page, limit };
}

export async function fetchPracticeLcAnalytics(handle: string): Promise<LcAnalyticsPayload> {
  const [profile, problems] = await Promise.all([
    fetchLcUserProfile(handle),
    getCachedLcProblemset(),
  ]);
  const slugDifficulty = new Map(
    problems.map((p) => [p.titleSlug, DIFFICULTY_SCORE[p.difficulty] ?? 0])
  );
  return processLcProfile(profile, slugDifficulty);
}

export async function fetchLeetcodeSolvedSlugsForSync(handle: string): Promise<string[]> {
  const profile = await fetchLcUserProfile(handle);
  return profile.recentAcSlugs;
}
