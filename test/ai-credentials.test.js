const test = require('node:test');
const assert = require('node:assert/strict');

const { maskApiKey } = require('../apps/api/dist/lib/ai-credentials.js');

test('maskApiKey hides middle of key', () => {
  assert.equal(maskApiKey('sk-proj-abcdefghijklmnop'), 'sk-proj…mnop');
  assert.equal(maskApiKey('short'), '••••••••');
});
