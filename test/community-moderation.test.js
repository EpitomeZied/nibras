'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CommunityModerationStatus,
  CommunityReportStatus,
} = require('@prisma/client');
const { visibleContentFilter } = require('../apps/api/dist/features/community/moderation');

test('visibleContentFilter hides moderated content for non-admin', () => {
  const student = {
    user: { id: 'u1', systemRole: 'user', username: 's' },
    memberships: [],
    authKind: 'web',
    token: 't',
  };
  assert.deepEqual(visibleContentFilter(student, false), {
    moderationStatus: CommunityModerationStatus.visible,
  });
  assert.deepEqual(visibleContentFilter(student, true), {
    moderationStatus: CommunityModerationStatus.visible,
  });
  const admin = {
    user: { id: 'a1', systemRole: 'admin', username: 'admin' },
    memberships: [],
    authKind: 'web',
    token: 't',
  };
  assert.deepEqual(visibleContentFilter(admin, true), {});
  assert.deepEqual(visibleContentFilter(null, false), {
    moderationStatus: CommunityModerationStatus.visible,
  });
});

test('CommunityReportStatus pending is default queue filter value', () => {
  assert.equal(CommunityReportStatus.pending, 'pending');
});
