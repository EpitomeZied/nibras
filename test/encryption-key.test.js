const test = require('node:test');
const assert = require('node:assert/strict');

const { getEncryptionKeyStatus } = require('../packages/core/dist/crypto.js');

test('getEncryptionKeyStatus reports missing when unset', () => {
  const prev = process.env.NIBRAS_ENCRYPTION_KEY;
  delete process.env.NIBRAS_ENCRYPTION_KEY;
  assert.equal(getEncryptionKeyStatus(), 'missing');
  if (prev !== undefined) process.env.NIBRAS_ENCRYPTION_KEY = prev;
});

test('getEncryptionKeyStatus reports ok for 64 hex chars', () => {
  const prev = process.env.NIBRAS_ENCRYPTION_KEY;
  process.env.NIBRAS_ENCRYPTION_KEY = 'a'.repeat(64);
  assert.equal(getEncryptionKeyStatus(), 'ok');
  if (prev !== undefined) process.env.NIBRAS_ENCRYPTION_KEY = prev;
  else delete process.env.NIBRAS_ENCRYPTION_KEY;
});

test('getEncryptionKeyStatus reports invalid for short key', () => {
  const prev = process.env.NIBRAS_ENCRYPTION_KEY;
  process.env.NIBRAS_ENCRYPTION_KEY = 'abcd';
  assert.equal(getEncryptionKeyStatus(), 'invalid');
  if (prev !== undefined) process.env.NIBRAS_ENCRYPTION_KEY = prev;
  else delete process.env.NIBRAS_ENCRYPTION_KEY;
});
