const test = require('node:test');
const assert = require('node:assert/strict');
const { IdeStatusResponseSchema } = require('@nibras/contracts');
const { filterCuratedLanguages } = require('../apps/api/dist/features/ide/languages');
const { normalizeJudge0Result } = require('../apps/api/dist/features/ide/judge0-client');

test('filterCuratedLanguages keeps supported runtimes only', () => {
  const languages = [
    { id: 1, name: 'Bash (5.0.0)' },
    { id: 54, name: 'C++ (GCC 9.2.0)' },
    { id: 71, name: 'Python (3.8.1)' },
    { id: 99, name: 'Rust (1.40.0)' },
  ];
  const curated = filterCuratedLanguages(languages);
  assert.equal(curated.length, 2);
  assert.ok(curated.some((item) => /C\+\+/i.test(item.name)));
  assert.ok(curated.some((item) => /Python/i.test(item.name)));
});

test('normalizeJudge0Result maps compile_output to compileOutput', () => {
  const normalized = normalizeJudge0Result({
    stdout: '42\n',
    stderr: null,
    compile_output: 'error: expected ;',
    message: 'exceeded',
    time: '0.12',
    memory: 2048,
    status: { id: 6, description: 'Compilation Error' },
  });
  assert.equal(normalized.compileOutput, 'error: expected ;');
  assert.equal(normalized.stdout, '42\n');
  assert.equal(normalized.message, 'exceeded');
  assert.equal(normalized.status.description, 'Compilation Error');
});

test('IdeStatusResponseSchema accepts sandbox limit metadata', () => {
  const parsed = IdeStatusResponseSchema.parse({
    configured: true,
    reachable: true,
    cpuTimeLimitSeconds: 5,
    memoryLimitKb: 128000,
  });
  assert.equal(parsed.cpuTimeLimitSeconds, 5);
  assert.equal(parsed.memoryLimitKb, 128000);
});
