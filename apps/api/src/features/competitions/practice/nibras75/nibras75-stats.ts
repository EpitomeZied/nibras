import { PrismaClient } from '@prisma/client';
import { getLcUserStatus } from '../leetcode/lc-api';
import { NIBRAS_75_CURRICULUM, NIBRAS_75_TOTAL } from './curriculum';
import type { Nibras75ProblemRow } from './nibras75-client';

export type Nibras75DifficultyBreakdown = {
  easy: { total: number; solved: number };
  medium: { total: number; solved: number };
  hard: { total: number; solved: number };
};

export type Nibras75TagMastery = {
  tag: string;
  total: number;
  solved: number;
};

export type Nibras75CalendarDay = {
  date: string;
  count: number;
};

export type Nibras75StatsPayload = {
  completedInSet: number;
  curriculumTotal: number;
  byDifficulty: Nibras75DifficultyBreakdown;
  tagMastery: Nibras75TagMastery[];
  calendar: Nibras75CalendarDay[];
  nextUnsolved: Pick<
    Nibras75ProblemRow,
    'rank' | 'problemId' | 'name' | 'url' | 'difficulty' | 'description'
  > | null;
};

async function loadDbProgressDetailed(
  prisma: PrismaClient,
  userId: string | undefined
): Promise<Map<string, { solved: boolean; attempted: boolean; solvedAt: Date | null }>> {
  const map = new Map<string, { solved: boolean; attempted: boolean; solvedAt: Date | null }>();
  if (!userId) return map;

  const slugs = new Set(NIBRAS_75_CURRICULUM.map((e) => e.slug));
  const progress = await prisma.userProblemProgress.findMany({
    where: { userId, problem: { platform: 'leetcode' } },
    select: {
      solved: true,
      solvedAt: true,
      problem: { select: { platformProblemId: true } },
    },
  });

  for (const row of progress) {
    const slug = row.problem.platformProblemId;
    if (!slugs.has(slug)) continue;
    map.set(slug, { solved: row.solved, attempted: true, solvedAt: row.solvedAt });
  }
  return map;
}

function mergeStatus(
  slug: string,
  dbProgress: Map<string, { solved: boolean; attempted: boolean; solvedAt: Date | null }>,
  lcStatus: Map<string, { solved: boolean; attempted: boolean }>
): { solved: boolean; attempted: boolean; solvedAt: Date | null } {
  const db = dbProgress.get(slug);
  if (db !== undefined) {
    return db;
  }
  const lc = lcStatus.get(slug);
  return {
    solved: lc?.solved ?? false,
    attempted: lc?.attempted ?? false,
    solvedAt: null,
  };
}

export async function fetchNibras75Stats(
  handle: string | undefined,
  userId: string | undefined,
  prisma: PrismaClient
): Promise<Nibras75StatsPayload> {
  const [lcStatus, dbProgress] = await Promise.all([
    getLcUserStatus(handle),
    loadDbProgressDetailed(prisma, userId),
  ]);

  const byDifficulty: Nibras75DifficultyBreakdown = {
    easy: { total: 0, solved: 0 },
    medium: { total: 0, solved: 0 },
    hard: { total: 0, solved: 0 },
  };

  const tagTotals = new Map<string, { total: number; solved: number }>();
  const calendarCounts = new Map<string, number>();
  let completedInSet = 0;
  let nextUnsolved: Nibras75StatsPayload['nextUnsolved'] = null;

  for (const entry of NIBRAS_75_CURRICULUM) {
    const st = mergeStatus(entry.slug, dbProgress, lcStatus);
    const diffKey =
      entry.difficulty === 'Easy' ? 'easy' : entry.difficulty === 'Hard' ? 'hard' : 'medium';
    byDifficulty[diffKey].total++;
    if (st.solved) {
      completedInSet++;
      byDifficulty[diffKey].solved++;
      if (st.solvedAt) {
        const dateKey = st.solvedAt.toISOString().slice(0, 10);
        calendarCounts.set(dateKey, (calendarCounts.get(dateKey) ?? 0) + 1);
      }
    } else if (!nextUnsolved) {
      nextUnsolved = {
        rank: entry.rank,
        problemId: entry.slug,
        name: entry.title,
        url: `https://leetcode.com/problems/${entry.slug}/`,
        difficulty: entry.difficulty,
        description: entry.description,
      };
    }

    for (const tag of entry.tags) {
      const row = tagTotals.get(tag) ?? { total: 0, solved: 0 };
      row.total++;
      if (st.solved) row.solved++;
      tagTotals.set(tag, row);
    }
  }

  const tagMastery = [...tagTotals.entries()]
    .map(([tag, row]) => ({ tag, total: row.total, solved: row.solved }))
    .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag));

  const today = new Date();
  const calendar: Nibras75CalendarDay[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    calendar.push({ date: dateKey, count: calendarCounts.get(dateKey) ?? 0 });
  }

  return {
    completedInSet,
    curriculumTotal: NIBRAS_75_TOTAL,
    byDifficulty,
    tagMastery,
    calendar,
    nextUnsolved,
  };
}
