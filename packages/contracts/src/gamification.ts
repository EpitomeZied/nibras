import { z } from 'zod';

export const BadgeRaritySchema = z.enum(['common', 'rare', 'epic', 'legendary']);

export const BadgeSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  rarity: BadgeRaritySchema.optional(),
  earnedAt: z.string().datetime().optional(),
  progress: z.number().int().nonnegative().optional(),
  threshold: z.number().int().positive().optional(),
});

export const AllBadgesResponseSchema = z.object({
  badges: z.array(BadgeSchema),
});

export const CheckAwardResponseSchema = z.object({
  awarded: z.array(BadgeSchema),
});

export const ReputationEventSchema = z.object({
  id: z.string().min(1),
  delta: z.number().int(),
  reason: z.string().min(1),
  detail: z.string().optional(),
  category: z.string().optional(),
  categoryLabel: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const MyReputationResponseSchema = z.object({
  total: z.number().int(),
  weeklyDelta: z.number().int(),
  monthlyDelta: z.number().int(),
  rank: z.number().int().positive().nullable(),
  percentile: z.number().int().min(0).max(100).nullable(),
  history: z.array(ReputationEventSchema).optional(),
});

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string().min(1),
  username: z.string().min(1),
  avatarUrl: z.string().optional(),
  score: z.number().int(),
  delta: z.number().int().optional(),
  badges: z.number().int().nonnegative().optional(),
  level: z.number().int().positive().optional(),
});

export const LeaderboardResponseSchema = z.object({
  entries: z.array(LeaderboardEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export const LeaderboardConfigResponseSchema = z.object({
  periods: z.array(z.object({ value: z.string(), label: z.string() })),
  scopes: z.array(z.object({ value: z.string(), label: z.string() })),
});

export type Badge = z.infer<typeof BadgeSchema>;
export type MyReputationResponse = z.infer<typeof MyReputationResponseSchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;
