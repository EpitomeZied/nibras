'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildApp } = require('../apps/api/dist/app');
const { FileStore } = require('../apps/api/dist/store');

function makeStorePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nibras-user-profile-'));
  return path.join(dir, 'store.json');
}

function seedSession(store, storePath, userId, token) {
  const data = store.read('http://127.0.0.1');
  if (!data.users.find((user) => user.id === userId)) {
    data.users.push({
      id: userId,
      username: userId.replace('user_', ''),
      email: `${userId}@nibras.dev`,
      githubLogin: userId,
      githubLinked: true,
      githubAppInstalled: false,
      systemRole: 'user',
      yearLevel: 1,
    });
  }
  data.sessions.push({
    accessToken: token,
    refreshToken: `${token}-refresh`,
    userId,
    createdAt: new Date().toISOString(),
  });
  store.write(data);
  return buildApp(new FileStore(storePath));
}

test('self profile includes queue stats but omits instructor rank fields', async () => {
  const storePath = makeStorePath();
  const store = new FileStore(storePath);
  const app = seedSession(store, storePath, 'user_demo', 'demo-token');

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/users/user_demo',
      headers: { authorization: 'Bearer demo-token' },
    });
    assert.equal(response.statusCode, 200);
    const payload = response.json();
    assert.equal(payload.viewerRole, 'self');
    assert.equal(payload.profile.id, 'user_demo');
    assert.ok(Array.isArray(payload.profile.socialLinks));
    assert.equal(typeof payload.stats.pendingCount, 'number');
    assert.equal(typeof payload.stats.needsReviewCount, 'number');
    assert.equal(payload.stats.avgScore, undefined);
    assert.equal(payload.gamification?.rank, undefined);
    assert.equal(payload.gamification?.percentile, undefined);
    for (const submission of payload.submissions ?? []) {
      assert.equal(submission.score, undefined);
    }
  } finally {
    await app.close();
  }
});

test('instructor can view student profile with detailed stats', async () => {
  const storePath = makeStorePath();
  const store = new FileStore(storePath);
  const data = store.read('http://127.0.0.1');
  const instructor = data.users.find((user) => user.id === 'user_instructor');
  if (instructor) {
    instructor.systemRole = 'user';
  }
  store.write(data);
  const app = seedSession(store, storePath, 'user_instructor', 'instructor-token');

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/users/user_demo',
      headers: { authorization: 'Bearer instructor-token' },
    });
    assert.equal(response.statusCode, 200);
    const payload = response.json();
    assert.equal(payload.viewerRole, 'instructor');
    assert.ok(payload.stats);
    assert.ok(Array.isArray(payload.submissions));
    assert.ok(payload.courseProgress?.length >= 1);
  } finally {
    await app.close();
  }
});

test('unrelated student sees limited authenticated profile slice', async () => {
  const storePath = makeStorePath();
  const store = new FileStore(storePath);
  const data = store.read('http://127.0.0.1');
  data.courseMemberships.push({
    id: 'membership_peer_isolated',
    courseId: 'course_isolated',
    userId: 'user_peer',
    role: 'student',
    level: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  store.write(data);
  const app = seedSession(store, storePath, 'user_peer', 'peer-token');

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/users/user_demo',
      headers: { authorization: 'Bearer peer-token' },
    });
    assert.equal(response.statusCode, 200);
    const payload = response.json();
    assert.equal(payload.viewerRole, 'authenticated');
    assert.equal(payload.submissions, undefined);
    assert.equal(payload.courseProgress, undefined);
    assert.equal(payload.activity, undefined);
  } finally {
    await app.close();
  }
});

test('unknown user returns 404', async () => {
  const storePath = makeStorePath();
  const store = new FileStore(storePath);
  const app = seedSession(store, storePath, 'user_demo', 'demo-token');

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/users/user_does_not_exist',
      headers: { authorization: 'Bearer demo-token' },
    });
    assert.equal(response.statusCode, 404);
  } finally {
    await app.close();
  }
});
