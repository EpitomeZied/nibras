import { PrismaClient, ReputationCategory } from '@prisma/client';
import { GamificationService } from '../gamification/service';

export async function awardCommunityReputation(
  prisma: PrismaClient,
  userId: string,
  opts: {
    delta: number;
    reason: string;
    source: string;
    category?: ReputationCategory;
    createdAt?: Date;
  }
): Promise<void> {
  if (opts.delta === 0) return;
  await prisma.reputationEvent.upsert({
    where: { userId_source: { userId, source: opts.source } },
    create: {
      userId,
      delta: opts.delta,
      reason: opts.reason,
      source: opts.source,
      category: opts.category ?? 'community',
      createdAt: opts.createdAt ?? new Date(),
    },
    update: {},
  });
  const gamification = new GamificationService(prisma);
  await gamification.checkAndAwardBadges(userId);
}

export async function awardQuestionUpvoteReceived(
  prisma: PrismaClient,
  questionAuthorId: string,
  questionId: string,
  voterId: string
): Promise<void> {
  if (questionAuthorId === voterId) return;
  await awardCommunityReputation(prisma, questionAuthorId, {
    delta: 3,
    reason: 'Your question received an upvote',
    source: `community-question-upvote:${questionId}:${voterId}`,
  });
}

export async function awardAnswerUpvoteReceived(
  prisma: PrismaClient,
  answerAuthorId: string,
  answerId: string,
  voterId: string
): Promise<void> {
  if (answerAuthorId === voterId) return;
  await awardCommunityReputation(prisma, answerAuthorId, {
    delta: 2,
    reason: 'Your answer received an upvote',
    source: `community-answer-upvote:${answerId}:${voterId}`,
  });
}

export async function awardPostUpvoteReceived(
  prisma: PrismaClient,
  postAuthorId: string,
  postId: string,
  voterId: string
): Promise<void> {
  if (postAuthorId === voterId) return;
  await awardCommunityReputation(prisma, postAuthorId, {
    delta: 1,
    reason: 'Your discussion reply received an upvote',
    source: `community-post-upvote:${postId}:${voterId}`,
  });
}

export async function awardAnswerAccepted(
  prisma: PrismaClient,
  answerAuthorId: string,
  answerId: string,
  questionTitle: string
): Promise<void> {
  await awardCommunityReputation(prisma, answerAuthorId, {
    delta: 15,
    reason: `Answer accepted on "${questionTitle.slice(0, 80)}"`,
    source: `answer-accepted:${answerId}`,
  });
}
