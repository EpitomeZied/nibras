import { PrismaClient, type Problem, type DailyProblemConfig } from '@prisma/client';

export async function selectDailyProblem(
  prisma: PrismaClient,
  userId: string,
  config: DailyProblemConfig
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

  const where: {
    id?: { notIn: string[] };
    difficulty?: { in: number[] };
    tags?: { hasSome: string[] };
  } = {};
  if (excludeIds.length > 0) where.id = { notIn: excludeIds };
  if (config.difficultyPref.length > 0) where.difficulty = { in: config.difficultyPref };
  if (config.tagPrefs.length > 0) where.tags = { hasSome: config.tagPrefs };

  const count = await prisma.problem.count({ where });
  if (count > 0) {
    const skip = Math.floor(Math.random() * count);
    const [problem] = await prisma.problem.findMany({ where, take: 1, skip });
    if (problem) return problem;
  }

  // Fallback 1: drop tag/difficulty preferences
  const fallbackWhere: { id?: { notIn: string[] } } = {};
  if (excludeIds.length > 0) fallbackWhere.id = { notIn: excludeIds };

  const fallbackCount = await prisma.problem.count({ where: fallbackWhere });
  if (fallbackCount > 0) {
    const skip = Math.floor(Math.random() * fallbackCount);
    const [problem] = await prisma.problem.findMany({ where: fallbackWhere, take: 1, skip });
    if (problem) return problem;
  }

  // Fallback 2: any problem (review mode)
  const totalCount = await prisma.problem.count();
  if (totalCount > 0) {
    const skip = Math.floor(Math.random() * totalCount);
    const [problem] = await prisma.problem.findMany({ take: 1, skip });
    if (problem) return problem;
  }

  return null;
}
