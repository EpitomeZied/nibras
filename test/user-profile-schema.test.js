'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { UserProfileResponseSchema } = require('../packages/contracts/dist/user-profile.js');

test('UserProfilePublicSchema normalizes empty displayName and yearLevel 0', () => {
  const parsed = UserProfileResponseSchema.parse({
    viewerRole: 'self',
    profile: {
      id: 'user_1',
      username: 'rivera42',
      displayName: '',
      githubLogin: 'rivera42',
      bio: null,
      primaryRole: 'student',
      yearLevel: 0,
      memberSince: '2026-01-01T00:00:00.000Z',
      socialLinks: [],
    },
    stats: {
      totalSubmissions: 0,
      passedCount: 0,
      pendingCount: 0,
      coursesEnrolled: 0,
    },
  });

  assert.equal(parsed.profile.displayName, null);
  assert.equal(parsed.profile.yearLevel, 1);
});

test('authenticated viewer limited profile slice validates', () => {
  const parsed = UserProfileResponseSchema.parse({
    viewerRole: 'authenticated',
    profile: {
      id: 'user_2',
      username: 'peer99',
      displayName: 'Peer',
      githubLogin: 'peer99',
      bio: 'Hello',
      primaryRole: 'student',
      yearLevel: 2,
      memberSince: '2026-02-01T00:00:00.000Z',
      socialLinks: [
        {
          platform: 'linkedin',
          value: 'https://linkedin.com/in/peer99',
          url: 'https://linkedin.com/in/peer99',
        },
      ],
    },
    gamification: {
      reputationTotal: 120,
      levelLabel: 'Level 2',
      earnedBadgeCount: 1,
      badges: [
        {
          id: 'b1',
          code: 'first',
          name: 'First',
          earnedAt: '2026-03-01T00:00:00.000Z',
        },
      ],
    },
    stats: {
      totalSubmissions: 0,
      passedCount: 3,
      pendingCount: 0,
      coursesEnrolled: 2,
    },
    dailyStreak: { current: 5, longest: 10, totalCompleted: 20 },
    competitionAccounts: [
      { platform: 'leetcode', handle: 'peer99', rating: 1800, verified: true },
    ],
  });

  assert.equal(parsed.viewerRole, 'authenticated');
  assert.equal(parsed.profile.socialLinks.length, 1);
  assert.equal(parsed.dailyStreak?.current, 5);
});
