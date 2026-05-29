const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveGitHubUserEmail } = require('../apps/web/lib/github-oauth-user.ts');

test('resolveGitHubUserEmail uses profile email when present', async () => {
  const email = await resolveGitHubUserEmail('token', {
    id: 1,
    login: 'octocat',
    email: 'octocat@example.com',
  });
  assert.equal(email, 'octocat@example.com');
});

test('resolveGitHubUserEmail falls back to noreply when no email available', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 403,
  });

  try {
    const email = await resolveGitHubUserEmail('token', {
      id: 42,
      login: 'hidden',
      email: null,
    });
    assert.equal(email, '42+hidden@users.noreply.github.com');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
