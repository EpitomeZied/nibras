const test = require('node:test');
const assert = require('node:assert/strict');

const { getPublicWebOrigin, sanitizeNextPath } = require('../apps/web/lib/public-origin.ts');

test('getPublicWebOrigin uses x-forwarded headers', () => {
  const origin = getPublicWebOrigin({
    headers: new Headers({
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'nibrasplatform.me',
    }),
  });
  assert.equal(origin, 'https://nibrasplatform.me');
});

test('getPublicWebOrigin falls back to configured web base URL', () => {
  const prev = process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL;
  process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL = 'https://nibrasplatform.me/';
  try {
    const origin = getPublicWebOrigin({ headers: new Headers() });
    assert.equal(origin, 'https://nibrasplatform.me');
  } finally {
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL = prev;
    }
  }
});

test('sanitizeNextPath rejects open redirects', () => {
  assert.equal(sanitizeNextPath('/settings'), '/settings');
  assert.equal(sanitizeNextPath('//evil.com'), '/dashboard');
  assert.equal(sanitizeNextPath(null), '/dashboard');
});
