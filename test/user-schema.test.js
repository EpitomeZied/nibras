const { test } = require('node:test');
const assert = require('node:assert/strict');
const { UserSchema } = require('../packages/contracts/dist/index.js');

test('UserSchema accepts magic-link style user without GitHub', () => {
  const parsed = UserSchema.parse({
    id: 'user_1',
    username: 'rivera42',
    email: 'rivera@example.com',
    displayName: '',
    githubLogin: 'rivera42',
    githubLinked: false,
    githubAppInstalled: false,
    yearLevel: 1,
  });

  assert.equal(parsed.displayName, null);
  assert.equal(parsed.githubLogin, 'rivera42');
});
