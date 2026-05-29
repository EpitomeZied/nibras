const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildApp } = require('../apps/api/dist/app');
const { FileStore } = require('../apps/api/dist/store');

function makeStorePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nibras-enroll-'));
  return path.join(dir, 'store.json');
}

function createAppWithNewbie(storePath) {
  const store = new FileStore(storePath);
  const token = 'newbie-token';
  const data = store.read('http://127.0.0.1');
  data.users.push({
    id: 'user_newbie',
    username: 'newbie',
    email: 'newbie@nibras.dev',
    githubLogin: 'newbie-user',
    githubLinked: true,
    githubAppInstalled: false,
    systemRole: 'user',
    yearLevel: 1,
  });
  data.sessions.push(
    {
      accessToken: token,
      refreshToken: `${token}-refresh`,
      userId: 'user_newbie',
      createdAt: new Date().toISOString(),
    },
    {
      accessToken: 'instructor-token',
      refreshToken: 'instructor-refresh',
      userId: 'user_instructor',
      createdAt: new Date().toISOString(),
    }
  );
  store.write(data);
  return { app: buildApp(new FileStore(storePath)), token };
}

test('browse returns public courses with enrollment flags', async () => {
  const storePath = makeStorePath();
  const { app, token } = createAppWithNewbie(storePath);

  try {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/tracking/courses/browse',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.statusCode, 200);
    const items = response.json();
    const publicCourse = items.find((entry) => entry.id === 'course_cs106l');
    assert.ok(publicCourse, 'expected public CS106L course in browse list');
    assert.equal(publicCourse.isPublic, true);
    assert.equal(publicCourse.isEnrolled, false);
    assert.equal(publicCourse.enrollmentRequestStatus, 'none');
  } finally {
    await app.close();
  }
});

test('public enroll creates membership and is idempotent', async () => {
  const storePath = makeStorePath();
  const { app, token } = createAppWithNewbie(storePath);

  try {
    const enroll = await app.inject({
      method: 'POST',
      url: '/v1/tracking/courses/course_cs106l/enroll',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(enroll.statusCode, 200);
    assert.deepEqual(enroll.json(), { ok: true, courseId: 'course_cs106l' });

    const again = await app.inject({
      method: 'POST',
      url: '/v1/tracking/courses/course_cs106l/enroll',
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(again.statusCode, 200);

    const browse = await app.inject({
      method: 'GET',
      url: '/v1/tracking/courses/browse',
      headers: { authorization: `Bearer ${token}` },
    });
    const course = browse.json().find((entry) => entry.id === 'course_cs106l');
    assert.equal(course.isEnrolled, true);
  } finally {
    await app.close();
  }
});

test('private request creates pending row; approve adds membership', async () => {
  const storePath = makeStorePath();
  const { app, token } = createAppWithNewbie(storePath);

  try {
    const created = await app.inject({
      method: 'POST',
      url: '/v1/tracking/courses/course_cs161/enrollment-requests',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ message: 'Please add me to CS161.' }),
    });
    assert.equal(created.statusCode, 201);
    const request = created.json();
    assert.equal(request.status, 'pending');
    assert.equal(request.courseId, 'course_cs161');

    const duplicate = await app.inject({
      method: 'POST',
      url: '/v1/tracking/courses/course_cs161/enrollment-requests',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ message: 'Still interested.' }),
    });
    assert.equal(duplicate.statusCode, 201);
    assert.equal(duplicate.json().id, request.id);

    const listed = await app.inject({
      method: 'GET',
      url: '/v1/tracking/courses/course_cs161/enrollment-requests?status=pending',
      headers: { authorization: 'Bearer instructor-token' },
    });
    assert.equal(listed.statusCode, 200);
    assert.equal(listed.json().length, 1);

    const approved = await app.inject({
      method: 'POST',
      url: `/v1/tracking/courses/course_cs161/enrollment-requests/${request.id}/approve`,
      headers: { authorization: 'Bearer instructor-token' },
    });
    assert.equal(approved.statusCode, 200);
    assert.equal(approved.json().status, 'approved');

    const browse = await app.inject({
      method: 'GET',
      url: '/v1/tracking/courses/browse',
      headers: { authorization: `Bearer ${token}` },
    });
    const course = browse.json().find((entry) => entry.id === 'course_cs161');
    assert.equal(course.isEnrolled, true);
    assert.equal(course.enrollmentRequestStatus, 'approved');
  } finally {
    await app.close();
  }
});

test('rejected request can be resubmitted as pending', async () => {
  const storePath = makeStorePath();
  const { app, token } = createAppWithNewbie(storePath);

  try {
    const created = await app.inject({
      method: 'POST',
      url: '/v1/tracking/courses/course_cs161/enrollment-requests',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({}),
    });
    const requestId = created.json().id;

    const rejected = await app.inject({
      method: 'POST',
      url: `/v1/tracking/courses/course_cs161/enrollment-requests/${requestId}/reject`,
      headers: { authorization: 'Bearer instructor-token' },
    });
    assert.equal(rejected.statusCode, 200);
    assert.equal(rejected.json().status, 'rejected');

    const resubmit = await app.inject({
      method: 'POST',
      url: '/v1/tracking/courses/course_cs161/enrollment-requests',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ message: 'Trying again.' }),
    });
    assert.equal(resubmit.statusCode, 201);
    assert.equal(resubmit.json().status, 'pending');
    assert.equal(resubmit.json().id, requestId);
  } finally {
    await app.close();
  }
});
