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
