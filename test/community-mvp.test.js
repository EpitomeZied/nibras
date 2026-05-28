'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { questionOrderBy } = require('../apps/api/dist/features/community/sort');
const { canAcceptAnswer } = require('../apps/api/dist/features/community/access');

test('questionOrderBy maps active sort to updatedAt desc', () => {
  assert.deepEqual(questionOrderBy('active'), { updatedAt: 'desc' });
  assert.deepEqual(questionOrderBy('top'), { votesCount: 'desc' });
  assert.deepEqual(questionOrderBy('unanswered'), { answersCount: 'asc' });
  assert.deepEqual(questionOrderBy(undefined), { createdAt: 'desc' });
});

test('canAcceptAnswer allows author, admin, and instructors', () => {
  const authorAuth = {
    user: { id: 'u1', systemRole: 'user', username: 'alice' },
    memberships: [],
  };
  const instructorAuth = {
    user: { id: 'u2', systemRole: 'user', username: 'prof' },
    memberships: [{ courseId: 'c1', role: 'instructor', level: 1 }],
  };
  const studentAuth = {
    user: { id: 'u3', systemRole: 'user', username: 'bob' },
    memberships: [{ courseId: 'c1', role: 'student', level: 1 }],
  };
  const adminAuth = {
    user: { id: 'u4', systemRole: 'admin', username: 'admin' },
    memberships: [],
  };

  assert.equal(canAcceptAnswer(authorAuth, 'u1'), true);
  assert.equal(canAcceptAnswer(adminAuth, 'u1'), true);
  assert.equal(canAcceptAnswer(instructorAuth, 'u1'), true);
  assert.equal(canAcceptAnswer(studentAuth, 'u1'), false);
});
