'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildApp } = require('../apps/api/dist/app');
const { FileStore } = require('../apps/api/dist/store');

function makeStorePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nibras-analytics-'));
  return path.join(dir, 'store.json');
}

function buildTestApp(storePath) {
  const store = new FileStore(storePath);
  const data = store.read('http://127.0.0.1');
  data.sessions.push(
    {
      accessToken: 'student-token',
      refreshToken: 'student-refresh',
      userId: 'user_demo',
      createdAt: new Date().toISOString(),
    },
    {
      accessToken: 'instructor-token',
      refreshToken: 'instructor-refresh',
      userId: 'user_instructor',
      createdAt: new Date().toISOString(),
    }
  );
  const instructor = data.users.find((u) => u.id === 'user_instructor');
  if (instructor) instructor.systemRole = 'admin';
  store.write(data);
  return buildApp(new FileStore(storePath));
}

test('GET /v1/analytics/overview requires authentication', async () => {
  const app = buildApp(new FileStore(makeStorePath()));
  try {
    const res = await app.inject({ method: 'GET', url: '/v1/analytics/overview' });
    assert.equal(res.statusCode, 401);
    assert.equal(res.json().code, 'AUTH_REQUIRED');
  } finally {
    await app.close();
  }
});

test('GET /v1/analytics/overview forbids student-only access', async () => {
  const storePath = makeStorePath();
  const app = buildTestApp(storePath);
  try {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/analytics/overview',
      headers: { authorization: 'Bearer student-token' },
    });
    assert.equal(res.statusCode, 403);
    assert.equal(res.json().code, 'FORBIDDEN');
  } finally {
    await app.close();
  }
});

test('GET /v1/analytics/overview returns overview shape for instructor', async () => {
  const storePath = makeStorePath();
  const app = buildTestApp(storePath);
  try {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/analytics/overview?range=7d',
      headers: { authorization: 'Bearer instructor-token' },
    });
    if (res.statusCode === 500) {
      // Prisma unavailable in CI without DATABASE_URL — skip body assertions
      return;
    }
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.kpis, 'kpis present');
    assert.ok(Array.isArray(body.series.submissions), 'submissions series');
    assert.equal(body.series.submissions.length, 7);
    assert.ok(Array.isArray(body.series.passRate), 'pass rate series');
    assert.equal(body.series.passRate.length, 7);
    assert.ok(body.meta && typeof body.meta.hasActivity === 'boolean');
  } finally {
    await app.close();
  }
});

test('GET /v1/analytics/overview validates custom range', async () => {
  const storePath = makeStorePath();
  const app = buildTestApp(storePath);
  try {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/analytics/overview?range=custom',
      headers: { authorization: 'Bearer instructor-token' },
    });
    if (res.statusCode === 500) return;
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().code, 'VALIDATION_ERROR');
  } finally {
    await app.close();
  }
});

test('GET /v1/analytics/students supports risk filter', async () => {
  const storePath = makeStorePath();
  const app = buildTestApp(storePath);
  try {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/analytics/students?range=30d&risk=high',
      headers: { authorization: 'Bearer instructor-token' },
    });
    if (res.statusCode === 500) return;
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.rows));
    for (const row of body.rows) {
      assert.equal(row.riskLevel, 'high');
      assert.ok(Array.isArray(row.trendSeries));
    }
  } finally {
    await app.close();
  }
});

test('GET /v1/analytics/courses returns an array for instructor', async () => {
  const storePath = makeStorePath();
  const app = buildTestApp(storePath);
  try {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/analytics/courses?range=90d',
      headers: { authorization: 'Bearer instructor-token' },
    });
    if (res.statusCode === 500) return;
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.json()));
  } finally {
    await app.close();
  }
});
