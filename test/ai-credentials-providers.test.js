const test = require('node:test');
const assert = require('node:assert/strict');

const {
  maskApiKey,
  AI_PROVIDER_PRESETS,
  resolveProviderPreset,
  hasPlatformAiKey,
} = require('../apps/api/dist/lib/ai-credentials.js');

test('maskApiKey hides middle of key', () => {
  assert.equal(maskApiKey('sk-proj-abcdefghijklmnop'), 'sk-proj…mnop');
  assert.equal(maskApiKey('short'), '••••••••');
});

test('resolveProviderPreset returns groq defaults', () => {
  const preset = resolveProviderPreset('groq');
  assert.equal(preset.id, 'groq');
  assert.equal(preset.baseUrl, 'https://api.groq.com/openai/v1');
  assert.ok(preset.models.includes('llama-3.1-8b-instant'));
});

test('AI_PROVIDER_PRESETS includes openrouter free model', () => {
  assert.ok(AI_PROVIDER_PRESETS.openrouter.models[0].includes('free'));
});

test('hasPlatformAiKey reflects env', () => {
  const prev = process.env.NIBRAS_AI_API_KEY;
  delete process.env.NIBRAS_AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  assert.equal(hasPlatformAiKey(), false);
  process.env.NIBRAS_AI_API_KEY = 'sk-test';
  assert.equal(hasPlatformAiKey(), true);
  if (prev === undefined) delete process.env.NIBRAS_AI_API_KEY;
  else process.env.NIBRAS_AI_API_KEY = prev;
});
