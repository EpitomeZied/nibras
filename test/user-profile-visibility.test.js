'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveProfileVisibility } = require('../apps/api/dist/features/users/policies/visibility.js');

test('resolveProfileVisibility allows authenticated peer with limited role', async () => {
  const auth = {
    user: { id: 'viewer_1', systemRole: 'user' },
    memberships: [{ courseId: 'course_a', role: 'student' }],
  };
  const store = {
    listCourseMemberships: async () => [{ courseId: 'course_b', role: 'student' }],
  };

  const result = await resolveProfileVisibility(auth, 'target_1', store, 'http://localhost:3000');
  assert.equal(result.allowed, true);
  assert.equal(result.viewerRole, 'authenticated');
});

test('resolveProfileVisibility returns instructor for shared course', async () => {
  const auth = {
    user: { id: 'inst_1', systemRole: 'user' },
    memberships: [{ courseId: 'course_a', role: 'instructor' }],
  };
  const store = {
    listCourseMemberships: async () => [{ courseId: 'course_a', role: 'student' }],
  };

  const result = await resolveProfileVisibility(auth, 'student_1', store, 'http://localhost:3000');
  assert.equal(result.allowed, true);
  assert.equal(result.viewerRole, 'instructor');
});
