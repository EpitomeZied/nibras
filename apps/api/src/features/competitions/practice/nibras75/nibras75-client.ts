import { PrismaClient } from '@prisma/client';
import { getLcUserStatus, questionUrl } from '../leetcode/lc-api';
import { NIBRAS_75_CURRICULUM, NIBRAS_75_TOTAL, type Nibras75Entry } from './curriculum';

export type Nibras75ProblemRow = {
  rank: number;
  problemId: string;
  name: string;
  url: string;
  difficulty: string;
  description: string;
  tags: string[];
  askedByCount: number;
  solved: boolean;
  attempted: boolean;
  acRate?: number;
};

export type Nibras75ProblemsQuery = {
  q?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  solved?: 'true' | 'false';
};

async function loadDbSolvedSlugs(
  prisma: PrismaClient,
  userId: string | undefined
): Promise<Map<string, { solved: boolean; attempted: boolean }>> {
  const map = new Map<string, { solved: boolean; attempted: boolean }>();
  if (!userId) return map;

  const progress = await prisma.userProblemProgress.findMany({
    where: { userId, problem: { platform: 'leetcode' } },
    select: { solved: true, problem: { select: { platformProblemId: true } } },
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

function matchesQuery(entry: Nibras75Entry, query: Nibras75ProblemsQuery): boolean {
  if (query.q?.trim()) {
    const q = query.q.trim().toLowerCase();
    if (
      !entry.title.toLowerCase().includes(q) &&
      !entry.slug.includes(q) &&
      !entry.tags.some((t) => t.includes(q))
    ) {
      return false;
    }
  }
  if (query.difficulty) {
    const label =
      query.difficulty === 'easy' ? 'Easy' : query.difficulty === 'medium' ? 'Medium' : 'Hard';
    if (entry.difficulty !== label) return false;
  }
  return true;
}

export async function fetchNibras75Problems(
  handle: string | undefined,
  userId: string | undefined,
  prisma: PrismaClient,
  query: Nibras75ProblemsQuery
): Promise<{
  items: Nibras75ProblemRow[];
  total: number;
  solvedCount: number;
  completedInSet: number;
}> {
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

  let completedInSet = 0;
  const rows: Nibras75ProblemRow[] = [];

  for (const entry of NIBRAS_75_CURRICULUM) {
    const st = mergeStatus(entry.slug);
    if (st.solved) completedInSet++;

    if (query.solved === 'true' && !st.solved) continue;
    if (query.solved === 'false' && st.solved) continue;
    if (!matchesQuery(entry, query)) continue;

    rows.push({
      rank: entry.rank,
      problemId: entry.slug,
      name: entry.title,
      url: questionUrl(entry.slug),
      difficulty: entry.difficulty,
      description: entry.description,
      tags: entry.tags,
      askedByCount: entry.askedByCount,
      solved: st.solved,
      attempted: st.attempted,
    });
  }

  return {
    items: rows,
    total: rows.length,
    solvedCount: completedInSet,
    completedInSet,
  };
}

export function getNibras75Meta() {
  return {
    total: NIBRAS_75_TOTAL,
    title: 'Nibras 75',
    subtitle:
      'The essential data structures and algorithms list for software engineering interviews — curated for LeetCode practice.',
  };
}
