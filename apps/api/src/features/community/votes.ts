import { CommunityVoteTargetType, PrismaClient } from '@prisma/client';

export async function attachMyVotes<T extends { id: string }>(
  prisma: PrismaClient,
  userId: string | undefined,
  targetType: CommunityVoteTargetType,
  items: T[]
): Promise<(T & { myVote: 1 | 0 | -1 })[]> {
  if (!userId || items.length === 0) {
    return items.map((item) => ({ ...item, myVote: 0 as const }));
  }
  const votes = await prisma.communityVote.findMany({
    where: {
      userId,
      targetType,
      targetId: { in: items.map((i) => i.id) },
    },
    select: { targetId: true, value: true },
  });
  const byTarget = new Map(votes.map((v) => [v.targetId, v.value]));
  return items.map((item) => {
    const raw = byTarget.get(item.id);
    const myVote = raw === 1 ? 1 : raw === -1 ? -1 : 0;
    return { ...item, myVote };
  });
}
