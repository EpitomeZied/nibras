const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getAuthProvidersConfig,
  getUnavailableSignInMessage,
  hasAnyAuthProvider,
} = require('../apps/web/lib/auth-providers-server.ts');

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
      RESEND_API_KEY: undefined,
    },
    () => {
      const config = getAuthProvidersConfig();
      assert.equal(config.github, false);
      assert.equal(config.magicLink, false);
      assert.equal(config.emailPassword, true);
    }
  );

  withEnv(
    {
      GITHUB_APP_CLIENT_ID: 'gh-id',
      GITHUB_APP_CLIENT_SECRET: 'gh-secret',
      RESEND_API_KEY: undefined,
    },
    () => {
      const config = getAuthProvidersConfig();
      assert.equal(config.github, true);
      assert.equal(config.magicLink, false);
      assert.equal(config.emailPassword, true);
    }
  );
});

test('magic link requires Resend API key', () => {
  withEnv(
    {
      GITHUB_APP_CLIENT_ID: undefined,
      GITHUB_APP_CLIENT_SECRET: undefined,
      RESEND_API_KEY: 're_test',
    },
    () => {
      const config = getAuthProvidersConfig();
      assert.equal(config.magicLink, true);
    }
  );
});

test('hasAnyAuthProvider is false when all providers are disabled', () => {
  assert.equal(
    hasAnyAuthProvider({ github: false, magicLink: false, emailPassword: false }),
    false
  );
  assert.equal(hasAnyAuthProvider({ github: true, magicLink: false, emailPassword: false }), true);
  assert.equal(hasAnyAuthProvider({ github: false, magicLink: true, emailPassword: false }), true);
  assert.equal(
    hasAnyAuthProvider({ github: false, magicLink: false, emailPassword: true }),
    true
  );
});

test('getUnavailableSignInMessage differs for production vs development', () => {
  const prod = getUnavailableSignInMessage(true);
  const dev = getUnavailableSignInMessage(false);
  assert.match(prod, /administrator/i);
  assert.match(dev, /GITHUB_APP_CLIENT_ID/);
  assert.notEqual(prod, dev);
});
