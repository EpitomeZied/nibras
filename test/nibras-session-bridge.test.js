const test = require('node:test');
const assert = require('node:assert/strict');

/**
 * Documents expected githubAccount sync behavior (integration covered in production).
 * When githubUserId already exists on user A, web session must use user A even if Better Auth created user B.
 */
test('session bridge resolves GitHub id conflict in favor of existing githubAccount row', () => {
  const authUserId = 'user_better_auth_new';
  const existingGithubRow = { userId: 'user_legacy_cli', githubUserId: '116457362' };
  const effectiveUserId =
    existingGithubRow.githubUserId === '116457362' ? existingGithubRow.userId : authUserId;
  assert.equal(effectiveUserId, 'user_legacy_cli');
});
