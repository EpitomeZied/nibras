import { z } from 'zod';

export const BadgeRaritySchema = z.enum(['common', 'rare', 'epic', 'legendary']);

export const BadgeCategorySchema = z.enum([
  'onboarding',
  'projects',
  'community',
  'practice',
  'competitions',
  'rating',
  'meta',
]);

export const BadgeSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  rarity: BadgeRaritySchema.optional(),
  category: BadgeCategorySchema.optional(),
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

/** Reputation score thresholds for user levels 1–12. */
export const REPUTATION_LEVEL_THRESHOLDS = [
  0, 250, 750, 1500, 3000, 6000, 10000, 15000, 22000, 32000, 45000, 65000,
] as const;

export const REPUTATION_LEVEL_NAMES = [
  'Spark',
  'Ember',
  'Flame',
  'Blaze',
  'Inferno',
  'Nova',
  'Comet',
  'Pulsar',
  'Quasar',
  'Nebula',
  'Galaxy',
  'Supernova',
] as const;

export function computeReputationLevel(score: number): number {
  let level = 1;
  for (let i = REPUTATION_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= REPUTATION_LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getReputationLevelName(level: number): string {
  const idx = Math.min(Math.max(level, 1), REPUTATION_LEVEL_NAMES.length) - 1;
  return REPUTATION_LEVEL_NAMES[idx] ?? `Level ${level}`;
}

export function getReputationLevelLabel(score: number): string {
  const level = computeReputationLevel(score);
  return `Level ${level} · ${getReputationLevelName(level)}`;
}

export function getReputationLevelProgress(score: number): {
  level: number;
  name: string;
  currentThreshold: number;
  nextThreshold: number | null;
  progressInLevel: number;
} {
  const level = computeReputationLevel(score);
  const currentThreshold = REPUTATION_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold =
    level < REPUTATION_LEVEL_THRESHOLDS.length ? REPUTATION_LEVEL_THRESHOLDS[level] : null;
  const span = nextThreshold != null ? nextThreshold - currentThreshold : 1;
  const progressInLevel =
    nextThreshold != null ? Math.min(1, Math.max(0, (score - currentThreshold) / span)) : 1;
  return {
    level,
    name: getReputationLevelName(level),
    currentThreshold,
    nextThreshold,
    progressInLevel,
  };
}
