import { PrismaClient, type DailyProblemConfig, type Problem, type Prisma } from '@prisma/client';

function buildDifficultyFilter(prefs: number[]): Prisma.ProblemWhereInput | undefined {
  if (prefs.length === 0) return undefined;
  const or: Prisma.ProblemWhereInput[] = [];
  if (prefs.some((p) => p <= 1000)) or.push({ difficulty: { lte: 1000 } });
  if (prefs.some((p) => p > 1000 && p <= 1800)) or.push({ difficulty: { gt: 1000, lte: 1800 } });
  if (prefs.some((p) => p > 1800)) or.push({ difficulty: { gt: 1800 } });
  return or.length > 0 ? { OR: or } : undefined;
}

export async function selectDailyProblem(
  prisma: PrismaClient,
  userId: string,
  config: Pick<DailyProblemConfig, 'difficultyPref' | 'tagPrefs'>
): Promise<Problem | null> {
  const assignedProblemIds = (
    await prisma.dailyProblemAssignment.findMany({
      where: { userId },
      select: { problemId: true },
    })
  ).map((a) => a.problemId);

  const solvedProblemIds = (
    await prisma.userProblemProgress.findMany({
      where: { userId, solved: true },
      select: { problemId: true },
    })
  ).map((p) => p.problemId);

  const excludeIds = [...new Set([...assignedProblemIds, ...solvedProblemIds])];

  const difficultyFilter = buildDifficultyFilter(config.difficultyPref);
  const where: Prisma.ProblemWhereInput = {
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    ...(difficultyFilter ?? {}),
    ...(config.tagPrefs.length > 0 ? { tags: { hasSome: config.tagPrefs } } : {}),
  };

  const count = await prisma.problem.count({ where });
  if (count > 0) {
    const skip = Math.floor(Math.random() * count);
    const [problem] = await prisma.problem.findMany({ where, take: 1, skip });
    if (problem) return problem;
  }

  const fallbackWhere: Prisma.ProblemWhereInput = {
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
  };
  const fallbackCount = await prisma.problem.count({ where: fallbackWhere });
  if (fallbackCount > 0) {
    const skip = Math.floor(Math.random() * fallbackCount);
    const [problem] = await prisma.problem.findMany({ where: fallbackWhere, take: 1, skip });
    if (problem) return problem;
  }

  const totalCount = await prisma.problem.count();
  if (totalCount > 0) {
    const skip = Math.floor(Math.random() * totalCount);
    const [problem] = await prisma.problem.findMany({ take: 1, skip });
    if (problem) return problem;
  }

  return null;
}
