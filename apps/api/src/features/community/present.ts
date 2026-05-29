import { PrismaClient } from '@prisma/client';

export const authorSelect = {
  id: true,
  username: true,
  githubAccount: { select: { login: true } },
} as const;

export type AuthorRow = {
  id: string;
  username: string;
  githubAccount: { login: string } | null;
};

function githubAvatarUrlForLogin(login: string | null | undefined, size = 64): string | undefined {
  const trimmed = login?.trim();
  if (!trimmed) return undefined;
  return `https://avatars.githubusercontent.com/${encodeURIComponent(trimmed)}?s=${size}`;
}

export function presentAuthor(author: AuthorRow, reputationByUserId?: Map<string, number>) {
  const login = author.githubAccount?.login;
  const reputation = reputationByUserId?.get(author.id);
  return {
    _id: author.id,
    userId: author.id,
    name: author.username,
    username: author.username,
    githubLogin: login,
    avatarUrl: githubAvatarUrlForLogin(login),
    ...(reputation !== undefined ? { reputation } : {}),
  };
}

export async function loadReputationTotals(
  prisma: PrismaClient,
  userIds: string[]
): Promise<Map<string, number>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const grouped = await prisma.reputationEvent.groupBy({
    by: ['userId'],
    where: { userId: { in: unique } },
    _sum: { delta: true },
  });
  const map = new Map<string, number>();
  for (const row of grouped) {
    map.set(row.userId, row._sum.delta ?? 0);
  }
  return map;
}

export function presentQuestion(
  q: {
    id: string;
    title: string;
    body: string;
    tags: string[];
    votesCount: number;
    answersCount: number;
    acceptedAnswerId: string | null;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
    author: AuthorRow;
  },
  reputationByUserId: Map<string, number>,
  myVote?: number
) {
  return {
    ...q,
    _id: q.id,
    views: q.viewCount,
    author: presentAuthor(q.author, reputationByUserId),
    ...(myVote !== undefined ? { myVote } : {}),
  };
}

export function presentThread(
  t: {
    id: string;
    courseId: string;
    title: string;
    body: string;
    tags: string[];
    pinned: boolean;
    closed: boolean;
    postsCount: number;
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
    author: AuthorRow;
  },
  reputationByUserId: Map<string, number>
) {
  return {
    ...t,
    _id: t.id,
    author: presentAuthor(t.author, reputationByUserId),
    replyCount: t.postsCount,
    lastActivityAt: t.lastActivityAt.toISOString(),
  };
}
