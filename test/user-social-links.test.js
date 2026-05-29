'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeSocialLink,
  normalizeSocialLinks,
} = require('../apps/api/dist/features/users/social-links.js');

test('normalizeSocialLink normalizes X handle to handle value', () => {
  const result = normalizeSocialLink({ platform: 'x', value: '@devuser' });
  assert.equal(result.platform, 'x');
  assert.equal(result.value, 'devuser');
  assert.equal(result.url, 'https://x.com/devuser');
});

test('normalizeSocialLinks dedupes platforms and skips empty', () => {
  const result = normalizeSocialLinks([
    { platform: 'website', value: 'https://example.com' },
    { platform: 'website', value: 'https://other.com' },
    { platform: 'linkedin', value: '   ' },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].platform, 'website');
});

test('normalizeSocialLink rejects invalid linkedin host', () => {
  assert.throws(() =>
    normalizeSocialLink({ platform: 'linkedin', value: 'https://evil.com/in/foo' })
  );
});
