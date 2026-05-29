import { z } from 'zod';
import { ReputationEventSchema } from './gamification';

export const UserProfileViewerRoleSchema = z.enum(['self', 'instructor', 'admin']);

export const UserProfilePublicSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().nullable(),
  githubLogin: z.string(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().nullable(),
  primaryRole: z.enum(['student', 'instructor', 'admin']),
  yearLevel: z.number().int().min(1).max(4),
  memberSince: z.string(),
});

export const UserProfileSubmissionSchema = z.object({
  id: z.string().min(1),
  projectKey: z.string().min(1),
  projectTitle: z.string().optional(),
  milestoneId: z.string().nullable(),
  commitSha: z.string(),
  repoUrl: z.string(),
  branch: z.string(),
  status: z.enum(['queued', 'running', 'passed', 'failed', 'needs_review']),
  summary: z.string().nullable(),
  submissionType: z.enum(['github', 'link', 'text']),
  submissionValue: z.string().nullable(),
  notes: z.string().nullable(),
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  localTestExitCode: z.number().nullable(),
  score: z.number().nullable().optional(),
  attemptNumber: z.number().int().positive().optional(),
});

export const UserProfileCourseProgressSchema = z.object({
  courseId: z.string().min(1),
  title: z.string(),
  role: z.enum(['student', 'instructor', 'ta']),
  completionPercent: z.number().min(0).max(100),
  enrolledAt: z.string().nullable(),
  totalMilestones: z.number().int().nonnegative().optional(),
  passedMilestones: z.number().int().nonnegative().optional(),
});

export const UserProfileActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  occurredAt: z.string(),
  href: z.string().optional(),
});

export const UserProfileGamificationSchema = z.object({
  reputationTotal: z.number(),
  levelLabel: z.string().optional(),
  rank: z.number().nullable().optional(),
  percentile: z.number().nullable().optional(),
  earnedBadgeCount: z.number().int().nonnegative(),
  badges: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      description: z.string().optional(),
      iconUrl: z.string().optional(),
      rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
      category: z.string().optional(),
      earnedAt: z.string().optional(),
      progress: z.number().optional(),
      threshold: z.number().optional(),
    })
  ),
  history: z.array(ReputationEventSchema).optional(),
});

export const UserProfileStatsSchema = z.object({
  totalSubmissions: z.number().int().nonnegative(),
  passedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative().optional(),
  needsReviewCount: z.number().int().nonnegative().optional(),
  avgScore: z.number().nullable().optional(),
  coursesEnrolled: z.number().int().nonnegative(),
});

export const UserProfileResponseSchema = z.object({
  viewerRole: UserProfileViewerRoleSchema,
  profile: UserProfilePublicSchema,
  courseProgress: z.array(UserProfileCourseProgressSchema).optional(),
  submissions: z.array(UserProfileSubmissionSchema).optional(),
  gamification: UserProfileGamificationSchema.optional(),
  activity: z.array(UserProfileActivitySchema).optional(),
  stats: UserProfileStatsSchema.optional(),
});

export type UserProfileViewerRole = z.infer<typeof UserProfileViewerRoleSchema>;
export type UserProfilePublic = z.infer<typeof UserProfilePublicSchema>;
export type UserProfileSubmission = z.infer<typeof UserProfileSubmissionSchema>;
export type UserProfileCourseProgress = z.infer<typeof UserProfileCourseProgressSchema>;
export type UserProfileActivity = z.infer<typeof UserProfileActivitySchema>;
export type UserProfileGamification = z.infer<typeof UserProfileGamificationSchema>;
export type UserProfileStats = z.infer<typeof UserProfileStatsSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
