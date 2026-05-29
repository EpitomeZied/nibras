import type { BadgeCategory, BadgeRarity } from '@prisma/client';
import type { BadgeMetric, BadgeSeed } from './badges-catalog';
import { RATING_PLATFORMS } from './rating-titles';

export type LadderOptions = {
  metric: BadgeMetric;
  category: BadgeCategory;
  codePrefix: string;
  namePrefix: string;
  descriptionTemplate: (threshold: number) => string;
  thresholds: number[];
  baseSortOrder: number;
  basePoints?: number;
  pointsStep?: number;
};

function rarityForThreshold(threshold: number, metric: BadgeMetric): BadgeRarity {
  if (metric === 'codeforcesMaxRating' || metric === 'leetcodeMaxRating') {
    if (threshold >= 3000) return 'legendary';
    if (threshold >= 2400) return 'epic';
    if (threshold >= 1900) return 'rare';
    return 'common';
  }
  if (threshold >= 100) return 'legendary';
  if (threshold >= 50) return 'epic';
  if (threshold >= 20) return 'rare';
  return 'common';
}

function pointsForThreshold(
  threshold: number,
  index: number,
  basePoints = 30,
  pointsStep = 8
): number {
  return Math.min(800, basePoints + index * pointsStep + Math.floor(threshold / 10));
}

export function buildThresholdLadder(opts: LadderOptions): BadgeSeed[] {
  return opts.thresholds.map((threshold, index) => {
    const rarity = rarityForThreshold(threshold, opts.metric);
    return {
      code: `${opts.codePrefix}-${threshold}`,
      name: `${opts.namePrefix} ${threshold}`,
      description: opts.descriptionTemplate(threshold),
      rarity,
      category: opts.category,
      metric: opts.metric,
      threshold,
      points: pointsForThreshold(threshold, index, opts.basePoints, opts.pointsStep),
      sortOrder: opts.baseSortOrder + index,
    };
  });
}

export function buildRatingBadges(): BadgeSeed[] {
  const badges: BadgeSeed[] = [];
  let sortOrder = 900;

  for (const platform of RATING_PLATFORMS) {
    for (const [index, title] of platform.titles.entries()) {
      const rarity = rarityForThreshold(title.threshold, platform.metric);
      badges.push({
        code: `${platform.codePrefix}-${title.codeSuffix}`,
        name: `${platform.platformLabel} ${title.title}`,
        description: `Reach a peak ${platform.platformLabel} contest rating of ${title.threshold}+ (verified linked account).`,
        rarity,
        category: 'rating',
        metric: platform.metric,
        threshold: title.threshold,
        points: pointsForThreshold(title.threshold, index, 40, 25),
        sortOrder: sortOrder++,
      });
    }
  }

  return badges;
}

export function buildMetaLadder(): BadgeSeed[] {
  const thresholds: number[] = [];
  for (let t = 40; t <= 160; t += 5) thresholds.push(t);

  return buildThresholdLadder({
    metric: 'earnedBadges',
    category: 'meta',
    codePrefix: 'meta-collector',
    namePrefix: 'Collector',
    descriptionTemplate: (n) => `Earn ${n} different badges on Nibras.`,
    thresholds,
    baseSortOrder: 980,
    basePoints: 120,
    pointsStep: 15,
  });
}

/** Activity ladders — thresholds chosen to avoid duplicating LEGACY_BADGES. */
export function buildExpansionLadders(count: number): BadgeSeed[] {
  const configs: LadderOptions[] = [
    {
      metric: 'passedSubmissions',
      category: 'projects',
      codePrefix: 'pass',
      namePrefix: 'Passed',
      descriptionTemplate: (n) => `Pass ${n} project submissions.`,
      thresholds: [2, 4, 6, 7, 8, 9, 12, 18, 20, 22, 28, 30, 35, 40, 45, 60, 75, 80, 90, 100],
      baseSortOrder: 100,
    },
    {
      metric: 'totalSubmissions',
      category: 'projects',
      codePrefix: 'submit',
      namePrefix: 'Submitted',
      descriptionTemplate: (n) => `Submit ${n} project attempts.`,
      thresholds: [2, 3, 5, 8, 10, 15, 25, 30, 40, 50, 75, 100],
      baseSortOrder: 120,
    },
    {
      metric: 'failedSubmissions',
      category: 'projects',
      codePrefix: 'fail-learn',
      namePrefix: 'Lessons from',
      descriptionTemplate: (n) => `Learn from ${n} failed submission attempts.`,
      thresholds: [1, 2, 3, 4, 10, 15, 20],
      baseSortOrder: 135,
    },
    {
      metric: 'teamMemberships',
      category: 'projects',
      codePrefix: 'team',
      namePrefix: 'Teams',
      descriptionTemplate: (n) => `Join ${n} project teams.`,
      thresholds: [2, 5, 10],
      baseSortOrder: 145,
    },
    {
      metric: 'assignmentSubmissions',
      category: 'projects',
      codePrefix: 'assign',
      namePrefix: 'Assignments',
      descriptionTemplate: (n) => `Submit ${n} course assignments.`,
      thresholds: [2, 3, 10, 15, 20, 30],
      baseSortOrder: 150,
    },
    {
      metric: 'courseEnrollments',
      category: 'onboarding',
      codePrefix: 'enroll',
      namePrefix: 'Enrolled',
      descriptionTemplate: (n) => `Enroll in ${n} courses.`,
      thresholds: [2, 5, 10],
      baseSortOrder: 8,
    },
    {
      metric: 'videosWatched',
      category: 'onboarding',
      codePrefix: 'video',
      namePrefix: 'Videos',
      descriptionTemplate: (n) => `Watch ${n} course videos.`,
      thresholds: [2, 3, 5, 15, 25, 50],
      baseSortOrder: 9,
    },
    {
      metric: 'questions',
      category: 'community',
      codePrefix: 'ask',
      namePrefix: 'Questions',
      descriptionTemplate: (n) => `Ask ${n} community questions.`,
      thresholds: [2, 3, 15, 20, 30],
      baseSortOrder: 200,
    },
    {
      metric: 'answers',
      category: 'community',
      codePrefix: 'answer',
      namePrefix: 'Answers',
      descriptionTemplate: (n) => `Post ${n} community answers.`,
      thresholds: [2, 3, 20, 30, 40, 50],
      baseSortOrder: 210,
    },
    {
      metric: 'acceptedAnswers',
      category: 'community',
      codePrefix: 'accepted',
      namePrefix: 'Accepted',
      descriptionTemplate: (n) => `Have ${n} answers accepted.`,
      thresholds: [2, 3, 15, 20],
      baseSortOrder: 220,
    },
    {
      metric: 'questionUpvotesReceived',
      category: 'community',
      codePrefix: 'q-upvotes',
      namePrefix: 'Question Upvotes',
      descriptionTemplate: (n) => `Receive ${n} upvotes on your questions.`,
      thresholds: [1, 10, 15, 50, 100],
      baseSortOrder: 230,
    },
    {
      metric: 'communityVotes',
      category: 'community',
      codePrefix: 'votes',
      namePrefix: 'Votes Cast',
      descriptionTemplate: (n) => `Cast ${n} community votes.`,
      thresholds: [1, 5, 25, 100, 200],
      baseSortOrder: 240,
    },
    {
      metric: 'threads',
      category: 'community',
      codePrefix: 'thread',
      namePrefix: 'Threads',
      descriptionTemplate: (n) => `Start ${n} discussion threads.`,
      thresholds: [2, 10, 20],
      baseSortOrder: 250,
    },
    {
      metric: 'threadPosts',
      category: 'community',
      codePrefix: 'reply',
      namePrefix: 'Replies',
      descriptionTemplate: (n) => `Post ${n} discussion replies.`,
      thresholds: [1, 5, 25, 50],
      baseSortOrder: 255,
    },
    {
      metric: 'solvedProblems',
      category: 'practice',
      codePrefix: 'solve',
      namePrefix: 'Solved',
      descriptionTemplate: (n) => `Solve ${n} practice problems.`,
      thresholds: [2, 3, 15, 30, 40, 60, 150, 250, 300],
      baseSortOrder: 300,
    },
    {
      metric: 'problemBookmarks',
      category: 'practice',
      codePrefix: 'bookmark',
      namePrefix: 'Bookmarked',
      descriptionTemplate: (n) => `Bookmark ${n} practice problems.`,
      thresholds: [1, 10, 50],
      baseSortOrder: 310,
    },
    {
      metric: 'dailyStreakLongest',
      category: 'practice',
      codePrefix: 'streak',
      namePrefix: 'Streak',
      descriptionTemplate: (n) => `Reach a ${n}-day daily problem streak.`,
      thresholds: [3, 5, 10, 21, 45, 60, 90],
      baseSortOrder: 320,
    },
    {
      metric: 'dailyProblemsCompleted',
      category: 'practice',
      codePrefix: 'daily',
      namePrefix: 'Daily Done',
      descriptionTemplate: (n) => `Complete ${n} daily problems.`,
      thresholds: [5, 10, 50, 75, 150, 200, 365],
      baseSortOrder: 330,
    },
    {
      metric: 'contestParticipations',
      category: 'competitions',
      codePrefix: 'contest',
      namePrefix: 'Contests',
      descriptionTemplate: (n) => `Participate in ${n} contests.`,
      thresholds: [2, 10, 20, 25, 40, 50, 75, 100],
      baseSortOrder: 400,
    },
    {
      metric: 'contestBookmarks',
      category: 'competitions',
      codePrefix: 'contest-save',
      namePrefix: 'Saved Contests',
      descriptionTemplate: (n) => `Bookmark ${n} contests.`,
      thresholds: [1, 10, 25, 50],
      baseSortOrder: 410,
    },
  ];

  const all: BadgeSeed[] = [];
  for (const config of configs) {
    all.push(...buildThresholdLadder(config));
    if (all.length >= count) break;
  }

  return all.slice(0, count);
}

export function assembleBadgeCatalog(legacy: BadgeSeed[], targetTotal = 200): BadgeSeed[] {
  const withoutMeta = legacy.filter((b) => b.category !== 'meta');
  const rating = buildRatingBadges();
  const meta = buildMetaLadder();
  const expansionCount = targetTotal - withoutMeta.length - rating.length - meta.length;
  const expansion = buildExpansionLadders(Math.max(0, expansionCount));

  const combined = [...withoutMeta, ...rating, ...expansion, ...meta];
  const codes = new Set<string>();
  for (const b of combined) {
    if (codes.has(b.code)) {
      throw new Error(`Duplicate badge code: ${b.code}`);
    }
    codes.add(b.code);
  }

  if (combined.length !== targetTotal) {
    throw new Error(
      `Badge catalog size ${combined.length} !== ${targetTotal} (legacy ${withoutMeta.length}, rating ${rating.length}, expansion ${expansion.length}, meta ${meta.length})`
    );
  }

  return combined.sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
}
