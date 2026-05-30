import { z } from 'zod';

export const DailyProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  platform: z.string(),
  difficulty: z.number(),
  tags: z.array(z.string()),
});

export const DailyStreakSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
  totalCompleted: z.number().int().nonnegative(),
  freezesLeft: z.number().int().nonnegative(),
});

export const DailyTodayResponseSchema = z.object({
  paused: z.boolean(),
  pausedUntil: z.string().optional(),
  assignment: z
    .object({
      id: z.string(),
      assignedDate: z.string(),
      solved: z.boolean(),
      solvedAt: z.string().optional(),
      skipped: z.boolean(),
      problem: DailyProblemSchema,
    })
    .optional(),
  streak: DailyStreakSchema,
});

export const DailyCalendarStatusSchema = z.enum(['solved', 'missed', 'skipped', 'pending', 'none']);

export const DailyMilestoneSchema = z.object({
  kind: z.enum(['streak', 'completed']),
  target: z.number().int().positive(),
  current: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  label: z.string(),
  reputationBonus: z.number().int().nonnegative().optional(),
});

export const DailyStatsResponseSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  totalCompleted: z.number().int().nonnegative(),
  freezesLeft: z.number().int().nonnegative(),
  calendar: z.array(
    z.object({
      date: z.string(),
      status: DailyCalendarStatusSchema,
    })
  ),
  nextMilestone: DailyMilestoneSchema.nullable().optional(),
});

export const DailyHistoryItemSchema = z.object({
  id: z.string(),
  assignedDate: z.string(),
  solved: z.boolean(),
  solvedAt: z.string().optional(),
  skipped: z.boolean(),
  missedAt: z.string().optional(),
  problem: DailyProblemSchema,
});

export const DailyHistoryResponseSchema = z.object({
  items: z.array(DailyHistoryItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export const DailyConfigResponseSchema = z.object({
  enabled: z.boolean(),
  difficultyPref: z.array(z.number()),
  tagPrefs: z.array(z.string()),
  timezone: z.string(),
  pausedUntil: z.string().nullable(),
  streakFreezes: z.number().int().nonnegative(),
});

export const DailySolveResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  streak: DailyStreakSchema.optional(),
  reputationEarned: z.number().int().nonnegative().optional(),
  milestoneBonus: z.number().int().nonnegative().optional(),
  newBadges: z.array(z.string()).optional(),
});

export const DailyProblemContextSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  platform: z.string(),
  difficulty: z.number(),
  tags: z.array(z.string()),
  description: z.string(),
});

export const DailyLeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string(),
  username: z.string(),
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  totalCompleted: z.number().int().nonnegative(),
});

export const DailyLeaderboardResponseSchema = z.object({
  entries: z.array(DailyLeaderboardEntrySchema),
});

export const DailyTagsResponseSchema = z.object({
  tags: z.array(z.string()),
});

export const DailyVerifyResponseSchema = z.object({
  verified: z.boolean(),
  error: z.string().optional(),
  streak: DailyStreakSchema.optional(),
  reputationEarned: z.number().int().nonnegative().optional(),
  milestoneBonus: z.number().int().nonnegative().optional(),
  newBadges: z.array(z.string()).optional(),
});

export type DailyProblem = z.infer<typeof DailyProblemSchema>;
export type DailyStreak = z.infer<typeof DailyStreakSchema>;
export type DailyTodayResponse = z.infer<typeof DailyTodayResponseSchema>;
export type DailyCalendarStatus = z.infer<typeof DailyCalendarStatusSchema>;
export type DailyMilestone = z.infer<typeof DailyMilestoneSchema>;
export type DailyStatsResponse = z.infer<typeof DailyStatsResponseSchema>;
export type DailyHistoryResponse = z.infer<typeof DailyHistoryResponseSchema>;
export type DailyConfigResponse = z.infer<typeof DailyConfigResponseSchema>;
export type DailySolveResponse = z.infer<typeof DailySolveResponseSchema>;
export type DailyProblemContext = z.infer<typeof DailyProblemContextSchema>;
export type DailyLeaderboardEntry = z.infer<typeof DailyLeaderboardEntrySchema>;
export type DailyLeaderboardResponse = z.infer<typeof DailyLeaderboardResponseSchema>;
