import { z } from 'zod';

export const CommunityModerationStatusSchema = z.enum(['visible', 'hidden', 'removed']);
export const CommunityReportStatusSchema = z.enum(['pending', 'dismissed', 'actioned']);
export const CommunityReportTargetTypeSchema = z.enum(['question', 'answer', 'post', 'thread']);

export const CommunityAuthorSchema = z.object({
  userId: z.string(),
  username: z.string(),
  githubLogin: z.string().optional(),
  avatarUrl: z.string().optional(),
  reputation: z.number().optional(),
});

export const CommunityQuestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  author: CommunityAuthorSchema,
  tags: z.array(z.string()),
  score: z.number(),
  myVote: z.union([z.literal(1), z.literal(0), z.literal(-1)]).optional(),
  answerCount: z.number(),
  acceptedAnswerId: z.string().nullable().optional(),
  views: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const QuestionFiltersSchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  tags: z.string().optional(),
  authorId: z.string().optional(),
  sort: z.enum(['newest', 'top', 'unanswered', 'active']).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export const CreateReportSchema = z.object({
  targetType: CommunityReportTargetTypeSchema,
  targetId: z.string().min(1),
  reason: z.string().min(1).max(500),
  details: z.string().max(2000).optional(),
});

export const ReviewReportSchema = z.object({
  action: z.enum(['dismiss', 'hide', 'remove']),
});

export type CommunityQuestion = z.infer<typeof CommunityQuestionSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
