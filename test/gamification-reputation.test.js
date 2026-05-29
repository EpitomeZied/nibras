'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  BADGE_CATALOG,
  computeLevel,
} = require('../apps/api/dist/features/gamification/badges-catalog');
const { GamificationService } = require('../apps/api/dist/features/gamification/service');
const { ReputationService } = require('../apps/api/dist/features/reputation/service');
const { buildApp } = require('../apps/api/dist/app');
const { FileStore } = require('../apps/api/dist/store');

test('BADGE_CATALOG has unique codes and computeLevel tiers', () => {
  const codes = new Set(BADGE_CATALOG.map((b) => b.code));
  assert.equal(BADGE_CATALOG.length, 200);
  assert.equal(codes.size, BADGE_CATALOG.length);
  assert.equal(computeLevel(0), 1);
  assert.equal(computeLevel(249), 1);
  assert.equal(computeLevel(250), 2);
  assert.equal(computeLevel(6000), 6);
  assert.equal(computeLevel(65000), 12);
});

test('GamificationService awards github-connected badge when linked', async () => {
  const userId = 'user_test';
  const badgeId = 'badge_github';
  const events = [];
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
        return { id: badgeId, ...def, code };
      },
      findMany: async () =>
        BADGE_CATALOG.map((b, i) => ({
          id: `badge_${i}`,
          ...b,
          description: b.description,
          iconUrl: null,
        })),
      count: async () => BADGE_CATALOG.length,
    },
    user: {
      findUnique: async () => ({
        githubLinked: true,
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
    linkedAccount: { findMany: async () => [] },
    userBadge: {
      count: async () => userBadges.length,
      findMany: async () => userBadges,
      create: async ({ data }) => {
        const row = { id: `ub_${userBadges.length}`, earnedAt: new Date(), ...data };
        userBadges.push(row);
        return row;
      },
    },
    reputationEvent: {
      upsert: async ({ create }) => {
        events.push(create);
        return create;
      },
      createMany: async () => ({ count: 0 }),
      findMany: async () => [],
      groupBy: async () => [],
      aggregate: async () => ({ _sum: { delta: 0 } }),
    },
  };

  const service = new GamificationService(prisma);
  const awarded = await service.checkAndAwardBadges(userId);
  assert.ok(awarded.length >= 1);
  assert.ok(awarded.some((b) => b.code === 'github-connected'));
});

test('ReputationService sync is idempotent for duplicate sources', async () => {
  const userId = 'user_rep';
  const store = new Map();

  const prisma = {
    user: {
      findUnique: async () => ({ lastReputationSyncAt: null }),
      update: async () => ({}),
    },
    submissionAttempt: {
      findMany: async () => [
        {
          id: 'sub1',
          submittedAt: new Date(),
          createdAt: new Date(),
          project: { name: 'Test Project' },
        },
      ],
    },
    communityAnswer: { findMany: async () => [] },
    communityQuestion: { findMany: async () => [] },
    userProblemProgress: { findMany: async () => [] },
    userContestParticipation: { findMany: async () => [] },
    userBadge: { findMany: async () => [] },
    dailyProblemAssignment: { findMany: async () => [] },
    linkedAccount: { findMany: async () => [] },
    reputationEvent: {
      upsert: async ({ where, create }) => {
        const key = `${where.userId_source.userId}:${where.userId_source.source}`;
        if (!store.has(key)) store.set(key, create);
        return store.get(key);
      },
      createMany: async ({ data }) => {
        for (const row of data) {
          const key = `${row.userId}:${row.source}`;
          if (!store.has(key)) store.set(key, row);
        }
        return { count: data.length };
      },
      findMany: async () => Array.from(store.values()),
      groupBy: async () => [{ userId, _sum: { delta: 10 } }],
      aggregate: async () => ({ _sum: { delta: 10 } }),
    },
  };

  const service = new ReputationService(prisma);
  await service.syncReputationFromActivity(userId);
  await service.syncReputationFromActivity(userId);
  assert.equal(store.size, 1);
});

test('unauthenticated gamification returns 401', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nibras-gamif-'));
  const app = buildApp(new FileStore(path.join(dir, 'store.json')));
  try {
    const res = await app.inject({ method: 'GET', url: '/v1/gamification/all-badges' });
    assert.equal(res.statusCode, 401);
    const body = res.json();
    assert.equal(body.code, 'AUTH_REQUIRED');
  } finally {
    await app.close();
  }
});
