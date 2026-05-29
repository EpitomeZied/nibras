const test = require('node:test');
const assert = require('node:assert/strict');

const { getAuthProvidersConfig } = require('../apps/web/lib/auth-providers-server.ts');

function withEnv(overrides, fn) {
  const saved = {};
  for (const key of Object.keys(overrides)) {
    saved[key] = process.env[key];
    const value = overrides[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

test('github requires GitHub app client credentials', () => {
  withEnv(
    {
      GITHUB_APP_CLIENT_ID: undefined,
      GITHUB_APP_CLIENT_SECRET: undefined,
    },
    () => {
      const config = getAuthProvidersConfig();
      assert.equal(config.github, false);
      assert.equal(config.magicLink, true);
    }
  );

  withEnv(
    {
      GITHUB_APP_CLIENT_ID: 'gh-id',
      GITHUB_APP_CLIENT_SECRET: 'gh-secret',
    },
    () => {
      const config = getAuthProvidersConfig();
      assert.equal(config.github, true);
    }
  );
});
