'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { BADGE_CATALOG, computeLevel } = require('../apps/api/dist/features/gamification/badges-catalog');
const { GamificationService } = require('../apps/api/dist/features/gamification/service');
const { ReputationService } = require('../apps/api/dist/features/reputation/service');
const { buildApp } = require('../apps/api/dist/app');
const { FileStore } = require('../apps/api/dist/store');

test('BADGE_CATALOG has unique codes and computeLevel tiers', () => {
  const codes = new Set(BADGE_CATALOG.map((b) => b.code));
  assert.equal(codes.size, BADGE_CATALOG.length);
  assert.equal(computeLevel(0), 1);
  assert.equal(computeLevel(249), 1);
  assert.equal(computeLevel(250), 2);
  assert.equal(computeLevel(6000), 6);
});

test('GamificationService awards github-connected badge when linked', async () => {
  const userId = 'user_test';
  const badgeId = 'badge_github';
  const events = [];
  const userBadges = [];

  const prisma = {
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
    },
    user: {
      findUnique: async () => ({ githubLinked: true }),
      findMany: async () => [],
    },
    submissionAttempt: { count: async () => 0, findMany: async () => [] },
    communityQuestion: { count: async () => 0, findMany: async () => [] },
    communityAnswer: { count: async () => 0, findMany: async () => [] },
    userProblemProgress: { count: async () => 0, findMany: async () => [] },
    userContestParticipation: { count: async () => 0, findMany: async () => [] },
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
    submissionAttempt: {
      findMany: async () => [{ id: 'sub1', submittedAt: new Date(), createdAt: new Date() }],
    },
    communityAnswer: { findMany: async () => [] },
    communityQuestion: { findMany: async () => [] },
    userProblemProgress: { findMany: async () => [] },
    userContestParticipation: { findMany: async () => [] },
    userBadge: { findMany: async () => [] },
    reputationEvent: {
      upsert: async ({ where, create }) => {
        const key = `${where.userId_source.userId}:${where.userId_source.source}`;
        if (!store.has(key)) store.set(key, create);
        return store.get(key);
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
