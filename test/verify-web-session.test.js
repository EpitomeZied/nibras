const test = require('node:test');
const assert = require('node:assert/strict');

const sampleUser = {
  id: 'user_1',
  username: 'demo',
  email: 'demo@example.com',
  displayName: 'Demo User',
  githubLinked: true,
  githubAppInstalled: false,
  systemRole: 'user',
  yearLevel: 2,
  githubAccount: { login: 'demo-gh' },
};

const sampleMemberships = [
  { courseId: 'course_1', role: 'student', level: 1 },
];

test('buildMeResponseFromSession maps user and memberships', async () => {
  const { buildMeResponseFromSession } = await import('../apps/web/lib/verify-web-session.ts');

  const response = buildMeResponseFromSession(
    sampleUser,
    sampleMemberships,
    'https://nibrasplatform.me'
  );

  assert.equal(response.user.username, 'demo');
  assert.equal(response.user.githubLogin, 'demo-gh');
  assert.equal(response.apiBaseUrl, 'https://nibrasplatform.me');
  assert.deepEqual(response.memberships, [
    { courseId: 'course_1', role: 'student', level: 1 },
  ]);
});

test('resolveGithubLogin falls back to username when GitHub account is absent', async () => {
  const { buildMeResponseFromSession, resolveGithubLogin } =
    await import('../apps/web/lib/verify-web-session.ts');

  assert.equal(resolveGithubLogin({ username: 'demo', githubAccount: null }), 'demo');

  const response = buildMeResponseFromSession(
    { ...sampleUser, githubAccount: null, githubLinked: false },
    [],
    'https://nibrasplatform.me'
  );
  assert.equal(response.user.githubLogin, 'demo');
});

test('resolveWebSessionMeResponseWith returns null for missing session', async () => {
  const { resolveWebSessionMeResponseWith } =
    await import('../apps/web/lib/verify-web-session.ts');

  const result = await resolveWebSessionMeResponseWith({
    prisma: {
      webSession: {
        findUnique: async () => null,
      },
      courseMembership: {
        findMany: async () => [],
      },
    },
    sessionToken: 'web_missing',
    apiBaseUrl: 'https://nibrasplatform.me',
  });

  assert.equal(result, null);
});

test('resolveWebSessionMeResponseWith returns null for revoked session', async () => {
  const { resolveWebSessionMeResponseWith } =
    await import('../apps/web/lib/verify-web-session.ts');

  const result = await resolveWebSessionMeResponseWith({
    prisma: {
      webSession: {
        findUnique: async () => ({
          sessionToken: 'web_revoked',
          userId: 'user_1',
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: new Date(),
          user: sampleUser,
        }),
      },
      courseMembership: {
        findMany: async () => [],
      },
    },
    sessionToken: 'web_revoked',
    apiBaseUrl: 'https://nibrasplatform.me',
  });

  assert.equal(result, null);
});

test('resolveWebSessionMeResponseWith returns null for expired session', async () => {
  const { resolveWebSessionMeResponseWith } =
    await import('../apps/web/lib/verify-web-session.ts');

  const result = await resolveWebSessionMeResponseWith({
    prisma: {
      webSession: {
        findUnique: async () => ({
          sessionToken: 'web_expired',
          userId: 'user_1',
          expiresAt: new Date(Date.now() - 60_000),
          revokedAt: null,
          user: sampleUser,
        }),
      },
      courseMembership: {
        findMany: async () => [],
      },
    },
    sessionToken: 'web_expired',
    apiBaseUrl: 'https://nibrasplatform.me',
  });

  assert.equal(result, null);
});

test('resolveWebSessionMeResponseWith returns MeResponse for valid session', async () => {
  const { resolveWebSessionMeResponseWith } =
    await import('../apps/web/lib/verify-web-session.ts');

  const result = await resolveWebSessionMeResponseWith({
    prisma: {
      webSession: {
        findUnique: async () => ({
          sessionToken: 'web_valid',
          userId: 'user_1',
          expiresAt: new Date(Date.now() + 60_000),
          revokedAt: null,
          user: sampleUser,
        }),
      },
      courseMembership: {
        findMany: async () => sampleMemberships,
      },
    },
    sessionToken: 'web_valid',
    apiBaseUrl: 'https://nibrasplatform.me',
  });

  assert.ok(result);
  assert.equal(result.user.username, 'demo');
  assert.equal(result.user.githubLogin, 'demo-gh');
});

test('resolvePublicApiBaseUrl prefers configured public API URL', async () => {
  const { resolvePublicApiBaseUrl } = await import('../apps/web/lib/verify-web-session.ts');
  const prevPublic = process.env.NEXT_PUBLIC_NIBRAS_API_BASE_URL;
  const prevApi = process.env.NIBRAS_API_BASE_URL;

  process.env.NEXT_PUBLIC_NIBRAS_API_BASE_URL = 'https://nibrasplatform.me/';
  delete process.env.NIBRAS_API_BASE_URL;

  try {
    assert.equal(
      resolvePublicApiBaseUrl('https://nibras-web.example.azurecontainerapps.io'),
      'https://nibrasplatform.me'
    );
  } finally {
    if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_NIBRAS_API_BASE_URL;
    else process.env.NEXT_PUBLIC_NIBRAS_API_BASE_URL = prevPublic;
    if (prevApi === undefined) delete process.env.NIBRAS_API_BASE_URL;
    else process.env.NIBRAS_API_BASE_URL = prevApi;
  }
});
