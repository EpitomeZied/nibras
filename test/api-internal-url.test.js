const test = require('node:test');
const assert = require('node:assert/strict');

test('resolveServerApiBaseUrls prefers explicit internal URL', async () => {
  const { resolveServerApiBaseUrls } = await import('../apps/web/lib/api-internal-url.ts');

  const original = {
    internal: process.env.NIBRAS_API_INTERNAL_URL,
    apiBase: process.env.NIBRAS_API_BASE_URL,
  };
  process.env.NIBRAS_API_INTERNAL_URL = 'https://nibras-api.example.azurecontainerapps.io';
  process.env.NIBRAS_API_BASE_URL = 'https://nibrasplatform.me';

  try {
    const urls = resolveServerApiBaseUrls('https://nibrasplatform.me');
    assert.equal(urls[0], 'https://nibras-api.example.azurecontainerapps.io');
    assert.ok(urls.includes('http://nibras-api:8080'));
    assert.ok(urls.includes('http://api:4848'));
    assert.ok(!urls.includes('https://nibrasplatform.me'));
  } finally {
    if (original.internal === undefined) delete process.env.NIBRAS_API_INTERNAL_URL;
    else process.env.NIBRAS_API_INTERNAL_URL = original.internal;
    if (original.apiBase === undefined) delete process.env.NIBRAS_API_BASE_URL;
    else process.env.NIBRAS_API_BASE_URL = original.apiBase;
  }
});

test('resolveServerApiBaseUrls skips web-origin API base URL', async () => {
  const { resolveServerApiBaseUrls } = await import('../apps/web/lib/api-internal-url.ts');

  const original = {
    internal: process.env.NIBRAS_API_INTERNAL_URL,
    apiBase: process.env.NIBRAS_API_BASE_URL,
  };
  delete process.env.NIBRAS_API_INTERNAL_URL;
  process.env.NIBRAS_API_BASE_URL = 'https://nibrasplatform.me';

  try {
    const urls = resolveServerApiBaseUrls('https://nibrasplatform.me');
    assert.equal(urls[0], 'http://nibras-api:8080');
    assert.ok(!urls.includes('https://nibrasplatform.me'));
  } finally {
    if (original.internal === undefined) delete process.env.NIBRAS_API_INTERNAL_URL;
    else process.env.NIBRAS_API_INTERNAL_URL = original.internal;
    if (original.apiBase === undefined) delete process.env.NIBRAS_API_BASE_URL;
    else process.env.NIBRAS_API_BASE_URL = original.apiBase;
  }
});
