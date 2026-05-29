'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { BADGE_CATALOG, BADGE_BY_CODE } = require('../apps/api/dist/features/gamification/badges-catalog');
const { GamificationService } = require('../apps/api/dist/features/gamification/service');
const {
  computeReputationLevel,
  getReputationLevelName,
  REPUTATION_LEVEL_THRESHOLDS,
} = require('@nibras/contracts');

test('BADGE_CATALOG has 200 unique codes', () => {
  assert.equal(BADGE_CATALOG.length, 200);
  const codes = new Set(BADGE_CATALOG.map((b) => b.code));
  assert.equal(codes.size, 200);
});

test('rating badges use peak metrics and official thresholds', () => {
  const cfExpert = BADGE_BY_CODE.get('cf-max-expert');
  assert.ok(cfExpert);
  assert.equal(cfExpert.metric, 'codeforcesMaxRating');
  assert.equal(cfExpert.threshold, 1600);
  assert.equal(cfExpert.category, 'rating');

  const lcKnight = BADGE_BY_CODE.get('lc-max-knight');
  assert.ok(lcKnight);
  assert.equal(lcKnight.metric, 'leetcodeMaxRating');
  assert.equal(lcKnight.threshold, 1200);
});

test('reputation levels — 6 tiers with names', () => {
  assert.equal(REPUTATION_LEVEL_THRESHOLDS.length, 6);
  assert.equal(computeReputationLevel(0), 1);
  assert.equal(computeReputationLevel(249), 1);
  assert.equal(computeReputationLevel(250), 2);
  assert.equal(getReputationLevelName(2), 'Apprentice');
  assert.equal(computeReputationLevel(6000), 6);
  assert.equal(computeReputationLevel(65000), 6);
  assert.equal(getReputationLevelName(6), 'Master');
});

test('GamificationService awards CF rating badges from platformMaxRating', async () => {
  const userId = 'user_cf_rating';
  const userBadges = [];

  const prisma = {
    $transaction: async (ops) => {
      const results = [];
      for (const op of ops) results.push(await op);
      return results;
    },
    badgeDefinition: {
      upsert: async ({ where, create }) => {
        const code = where.code;
        const def = BADGE_CATALOG.find((b) => b.code === code) || create;
        return { id: `badge_${code}`, ...def, code };
      },
      findMany: async () =>
        BADGE_CATALOG.map((b) => ({
          id: `badge_${b.code}`,
          ...b,
          description: b.description,
          iconUrl: null,
        })),
      count: async () => BADGE_CATALOG.length,
    },
    user: {
      findUnique: async () => ({
        githubLinked: false,
        githubAppInstalled: false,
        lastReputationSyncAt: null,
      }),
      findMany: async () => [],
      update: async () => ({}),
    },
    submissionAttempt: { count: async () => 0, findMany: async () => [] },
    communityQuestion: {
      count: async () => 0,
      findMany: async () => [],
      aggregate: async () => ({ _sum: { votesCount: 0 } }),
    },
    communityAnswer: { count: async () => 0, findMany: async () => [] },
    communityVote: { count: async () => 0 },
    communityThread: { count: async () => 0 },
    communityPost: { count: async () => 0 },
    userProblemProgress: { count: async () => 0, findMany: async () => [] },
    userContestParticipation: { count: async () => 0, findMany: async () => [] },
    teamMember: { count: async () => 0 },
    courseMembership: { count: async () => 0 },
    assignmentSubmission: { count: async () => 0 },
    videoProgress: { count: async () => 0 },
    problemBookmark: { count: async () => 0 },
    contestBookmark: { count: async () => 0 },
    dailyProblemConfig: { findUnique: async () => null },
    dailyProblemAssignment: { findMany: async () => [] },
    linkedAccount: {
      findMany: async () => [
        {
          platform: 'codeforces',
          platformMaxRating: 1650,
        },
      ],
    },
    userBadge: {
      count: async () => userBadges.length,
      findMany: async () => userBadges,
      create: async ({ data }) => {
        const def = BADGE_CATALOG.find((b) => b.code.startsWith('cf-max'));
        const row = {
          id: `ub_${userBadges.length}`,
          earnedAt: new Date(),
          badgeId: data.badgeId,
        };
        userBadges.push(row);
        return row;
      },
    },
    reputationEvent: {
      upsert: async () => ({}),
      findMany: async () => [],
      aggregate: async () => ({ _sum: { delta: 0 } }),
    },
  };

  const service = new GamificationService(prisma);
  const awarded = await service.checkAndAwardBadges(userId, { skipSync: true });
  const codes = awarded.map((b) => b.code);
  assert.ok(codes.includes('cf-max-expert'));
  assert.ok(!codes.includes('cf-max-candidate-master'));
});
