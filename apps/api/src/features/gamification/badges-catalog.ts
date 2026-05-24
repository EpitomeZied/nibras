import type { BadgeCategory, BadgeRarity } from '@prisma/client';

export type BadgeSeed = {
  code: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  threshold: number;
  points: number;
  sortOrder: number;
};

export const BADGE_CATALOG: BadgeSeed[] = [
  {
    code: 'github-connected',
    name: 'GitHub Connected',
    description: 'Link your GitHub account to Nibras.',
    rarity: 'common',
    category: 'onboarding',
    threshold: 1,
    points: 25,
    sortOrder: 1,
  },
  {
    code: 'first-steps',
    name: 'First Steps',
    description: 'Pass your first project submission.',
    rarity: 'common',
    category: 'projects',
    threshold: 1,
    points: 50,
    sortOrder: 10,
  },
  {
    code: 'ship-it',
    name: 'Ship It',
    description: 'Pass five project submissions.',
    rarity: 'rare',
    category: 'projects',
    threshold: 5,
    points: 100,
    sortOrder: 11,
  },
  {
    code: 'project-veteran',
    name: 'Project Veteran',
    description: 'Pass ten project submissions.',
    rarity: 'epic',
    category: 'projects',
    threshold: 10,
    points: 200,
    sortOrder: 12,
  },
  {
    code: 'curious-mind',
    name: 'Curious Mind',
    description: 'Ask your first community question.',
    rarity: 'common',
    category: 'community',
    threshold: 1,
    points: 25,
    sortOrder: 20,
  },
  {
    code: 'helpful-peer',
    name: 'Helpful Peer',
    description: 'Post your first community answer.',
    rarity: 'common',
    category: 'community',
    threshold: 1,
    points: 25,
    sortOrder: 21,
  },
  {
    code: 'accepted-answer',
    name: 'Accepted Answer',
    description: 'Have an answer accepted by the question author.',
    rarity: 'rare',
    category: 'community',
    threshold: 1,
    points: 75,
    sortOrder: 22,
  },
  {
    code: 'problem-solver-1',
    name: 'Problem Solver',
    description: 'Solve your first practice problem.',
    rarity: 'common',
    category: 'practice',
    threshold: 1,
    points: 25,
    sortOrder: 30,
  },
  {
    code: 'problem-solver-10',
    name: 'Practice Pro',
    description: 'Solve ten practice problems.',
    rarity: 'rare',
    category: 'practice',
    threshold: 10,
    points: 100,
    sortOrder: 31,
  },
  {
    code: 'problem-solver-50',
    name: 'Algorithm Ace',
    description: 'Solve fifty practice problems.',
    rarity: 'legendary',
    category: 'practice',
    threshold: 50,
    points: 300,
    sortOrder: 32,
  },
  {
    code: 'contest-debut',
    name: 'Contest Debut',
    description: 'Participate in your first contest.',
    rarity: 'common',
    category: 'competitions',
    threshold: 1,
    points: 50,
    sortOrder: 40,
  },
  {
    code: 'badge-collector',
    name: 'Badge Collector',
    description: 'Earn five different badges.',
    rarity: 'epic',
    category: 'meta',
    threshold: 5,
    points: 150,
    sortOrder: 50,
  },
];

export const LEVEL_THRESHOLDS = [0, 250, 750, 1500, 3000, 6000] as const;

export function computeLevel(score: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}
