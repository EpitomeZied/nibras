const test = require('node:test');
const assert = require('node:assert/strict');

function saveEnv(keys) {
  const snapshot = {};
  for (const key of keys) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreEnv(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

test('resolveServerApiBaseUrls prefers explicit internal URL outside Azure', async () => {
  const { resolveServerApiBaseUrls } = await import('../apps/web/lib/api-internal-url.ts');

  const env = saveEnv(['NIBRAS_API_INTERNAL_URL', 'NIBRAS_API_BASE_URL', 'CONTAINER_APP_NAME']);
  delete process.env.CONTAINER_APP_NAME;
  process.env.NIBRAS_API_INTERNAL_URL = 'https://nibras-api.example.azurecontainerapps.io';
  process.env.NIBRAS_API_BASE_URL = 'https://nibrasplatform.me';

  try {
    const urls = resolveServerApiBaseUrls('https://nibrasplatform.me');
    assert.equal(urls[0], 'https://nibras-api.example.azurecontainerapps.io');
    assert.ok(urls.includes('http://nibras-api:8080'));
    assert.ok(urls.includes('http://api:4848'));
    assert.ok(!urls.includes('https://nibrasplatform.me'));
  } finally {
    restoreEnv(env);
  }
});

test('resolveServerApiBaseUrls skips web-origin API base URL', async () => {
  const { resolveServerApiBaseUrls } = await import('../apps/web/lib/api-internal-url.ts');

  const env = saveEnv(['NIBRAS_API_INTERNAL_URL', 'NIBRAS_API_BASE_URL', 'CONTAINER_APP_NAME']);
  delete process.env.CONTAINER_APP_NAME;
  delete process.env.NIBRAS_API_INTERNAL_URL;
  process.env.NIBRAS_API_BASE_URL = 'https://nibrasplatform.me';

  try {
    const urls = resolveServerApiBaseUrls('https://nibrasplatform.me');
    assert.equal(urls[0], 'http://nibras-api:8080');
    assert.ok(!urls.includes('https://nibrasplatform.me'));
  } finally {
    restoreEnv(env);
  }
});

test('resolveServerApiBaseUrls prefers Azure in-environment HTTP on Container Apps', async () => {
  const { resolveServerApiBaseUrls } = await import('../apps/web/lib/api-internal-url.ts');

  const env = saveEnv(['NIBRAS_API_INTERNAL_URL', 'NIBRAS_API_BASE_URL', 'CONTAINER_APP_NAME']);
  process.env.CONTAINER_APP_NAME = 'nibras-web';
  process.env.NIBRAS_API_INTERNAL_URL = 'https://nibras-api.example.azurecontainerapps.io';

  try {
    const urls = resolveServerApiBaseUrls('https://nibrasplatform.me');
    assert.equal(urls[0], 'http://nibras-api');
    assert.equal(urls[1], 'http://nibras-api:8080');
    assert.ok(urls.includes('https://nibras-api.example.azurecontainerapps.io'));
  } finally {
    restoreEnv(env);
  }
});

test('resolveCandidateTimeoutMs budgets first candidate higher than fallbacks', async () => {
  const { resolveCandidateTimeoutMs } = await import('../apps/web/lib/api-internal-url.ts');

  assert.equal(resolveCandidateTimeoutMs(0, 25_000), 20_000);
  assert.equal(resolveCandidateTimeoutMs(1, 25_000), 3_000);
  assert.equal(resolveCandidateTimeoutMs(0, 1_000), 1_000);
});
