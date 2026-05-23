import { PrismaClient } from '@prisma/client';
import { getLcUserStatus, questionUrl } from '../leetcode/lc-api';
import { companyIconUrl, pickCompaniesForProblem } from './companies';
import { NIBRAS_75_CURRICULUM, NIBRAS_75_TOTAL, type Nibras75Entry } from './curriculum';
export type Nibras75CompanyDto = {
  id: string;
  name: string;
  domain: string;
  iconUrl: string;
};

export type Nibras75ProblemRow = {
  rank: number;
  problemId: string;
  name: string;
  url: string;
  difficulty: string;
  description: string;
  tags: string[];
  askedByCount: number;
  companies: Nibras75CompanyDto[];
  solved: boolean;
  attempted: boolean;
  userMarked: boolean;
  acRate?: number;
};

export type Nibras75ProblemsQuery = {
  q?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  solved?: 'true' | 'false';
};

async function loadDbProgress(
  prisma: PrismaClient,
  userId: string | undefined
): Promise<Map<string, { solved: boolean; attempted: boolean }>> {
  const map = new Map<string, { solved: boolean; attempted: boolean }>();
  if (!userId) return map;

  const slugs = new Set(NIBRAS_75_CURRICULUM.map((e) => e.slug));
  const progress = await prisma.userProblemProgress.findMany({
    where: { userId, problem: { platform: 'leetcode' } },
    select: { solved: true, problem: { select: { platformProblemId: true } } },
  });

  for (const row of progress) {
    const slug = row.problem.platformProblemId;
    if (!slugs.has(slug)) continue;
    map.set(slug, { solved: row.solved, attempted: true });
  }
  return map;
}

function findCurriculumEntry(slug: string): Nibras75Entry | undefined {
  return NIBRAS_75_CURRICULUM.find((e) => e.slug === slug);
}

export async function setNibras75ProblemSolved(
  prisma: PrismaClient,
  userId: string,
  slug: string,
  solved: boolean
): Promise<{ solved: boolean; problemId: string }> {
  const entry = findCurriculumEntry(slug);
  if (!entry) {
    throw new Error('Problem is not part of Nibras 75');
  }

  const problem = await prisma.problem.upsert({
    where: {
      platform_platformProblemId: { platform: 'leetcode', platformProblemId: slug },
    },
    create: {
      platform: 'leetcode',
      platformProblemId: slug,
      title: entry.title,
      url: questionUrl(slug),
      difficulty:
        entry.difficulty === 'Easy' ? 800 : entry.difficulty === 'Medium' ? 1500 : 2200,
      tags: entry.tags,
    },
    update: {
      title: entry.title,
      url: questionUrl(slug),
    },
  });

  await prisma.userProblemProgress.upsert({
    where: { userId_problemId: { userId, problemId: problem.id } },
    create: {
      userId,
      problemId: problem.id,
      solved,
      solvedAt: solved ? new Date() : null,
    },
    update: {
      solved,
      solvedAt: solved ? new Date() : null,
    },
  });

  return { solved, problemId: slug };
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
  const [lcStatus, dbProgress] = await Promise.all([
    getLcUserStatus(handle),
    loadDbProgress(prisma, userId),
  ]);

  const mergeStatus = (slug: string) => {
    const db = dbProgress.get(slug);
    if (db !== undefined) {
      return { solved: db.solved, attempted: db.attempted, userMarked: true };
    }
    const lc = lcStatus.get(slug);
    return {
      solved: lc?.solved ?? false,
      attempted: lc?.attempted ?? false,
      userMarked: false,
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

    const companies = pickCompaniesForProblem(entry.slug, entry.askedByCount).map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      iconUrl: companyIconUrl(c.domain),
    }));

    rows.push({
      rank: entry.rank,
      problemId: entry.slug,
      name: entry.title,
      url: questionUrl(entry.slug),
      difficulty: entry.difficulty,
      description: entry.description,
      tags: entry.tags,
      askedByCount: entry.askedByCount,
      companies,
      solved: st.solved,
      attempted: st.attempted,
      userMarked: st.userMarked,
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
