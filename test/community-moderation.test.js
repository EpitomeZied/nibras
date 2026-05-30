'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CommunityModerationStatus,
  CommunityReportStatus,
} = require('@prisma/client');
const { visibleContentFilter } = require('../apps/api/dist/features/community/moderation');
const { canManageCourseDiscussions } = require('../apps/api/dist/features/community/access');
const { presentThreadAdmin } = require('../apps/api/dist/features/community/present');

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

test('canManageCourseDiscussions allows system admin without course membership', () => {
  const adminAuth = {
    user: { id: 'a1', systemRole: 'admin', username: 'admin' },
    memberships: [],
    authKind: 'web',
    token: 't',
  };
  assert.equal(canManageCourseDiscussions(adminAuth, 'course-xyz'), true);
});

test('canManageCourseDiscussions allows instructor or TA on course only', () => {
  const instructorAuth = {
    user: { id: 'i1', systemRole: 'user', username: 'prof' },
    memberships: [{ courseId: 'c1', role: 'instructor', level: 1 }],
    authKind: 'web',
    token: 't',
  };
  const studentAuth = {
    user: { id: 's1', systemRole: 'user', username: 'stu' },
    memberships: [{ courseId: 'c1', role: 'student', level: 1 }],
    authKind: 'web',
    token: 't',
  };
  assert.equal(canManageCourseDiscussions(instructorAuth, 'c1'), true);
  assert.equal(canManageCourseDiscussions(instructorAuth, 'c2'), false);
  assert.equal(canManageCourseDiscussions(studentAuth, 'c1'), false);
});

test('presentThreadAdmin includes moderation and course fields', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  const presented = presentThreadAdmin(
    {
      id: 't1',
      courseId: 'c1',
      title: 'Hello',
      body: 'Body',
      tags: ['hw'],
      pinned: true,
      closed: false,
      postsCount: 2,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
      moderationStatus: CommunityModerationStatus.hidden,
      author: { id: 'u1', username: 'alice', githubAccount: null },
      course: { id: 'c1', title: 'Intro', courseCode: 'CS101' },
    },
    new Map()
  );
  assert.equal(presented.moderationStatus, 'hidden');
  assert.equal(presented.courseCode, 'CS101');
  assert.equal(presented.courseTitle, 'Intro');
  assert.equal(presented.replyCount, 2);
});
