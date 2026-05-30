const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const repoRoot = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const onboardingHelperPath = path.join(
  repoRoot,
  'apps',
  'web',
  'app',
  '(app)',
  'instructor',
  'onboarding',
  'onboarding-content.js'
);

const installSh = fs.readFileSync(path.join(repoRoot, 'scripts', 'install.sh'), 'utf8');
const installPs1 = fs.readFileSync(path.join(repoRoot, 'scripts', 'install.ps1'), 'utf8');
const studentGuide = fs.readFileSync(path.join(repoRoot, 'docs', 'student-guide.md'), 'utf8');
const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');

function renderForRelease(script) {
  return script.replaceAll('@NIBRAS_CLI_VERSION@', pkg.version);
}

test('install scripts contain a release version placeholder', () => {
  assert.match(installSh, /@NIBRAS_CLI_VERSION@/);
  assert.match(installPs1, /@NIBRAS_CLI_VERSION@/);
});

test('install.sh --check succeeds in this repo', () => {
  const result = spawnSync('bash', [path.join(repoRoot, 'scripts', 'install.sh'), '--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, [result.stdout, result.stderr].filter(Boolean).join('\n'));
  assert.match(result.stdout, new RegExp(`@nibras/cli@${pkg.version}`));
});

test('rendered install.sh targets the current package version', () => {
  const rendered = renderForRelease(installSh);
  const tmp = path.join(repoRoot, '.tmp-install-sh-test.sh');
  fs.writeFileSync(tmp, rendered, { mode: 0o755 });
  try {
    const result = spawnSync('bash', [tmp, '--check'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, [result.stdout, result.stderr].filter(Boolean).join('\n'));
    assert.match(result.stdout, new RegExp(`@nibras/cli@${pkg.version}`));
  } finally {
    fs.unlinkSync(tmp);
  }
});

test('onboarding install helpers point at GitHub release assets', async () => {
  const {
    getUnixInstallCommand,
    getWindowsInstallCommand,
    PINNED_RELEASE_TAG,
  } = await import(pathToFileURL(onboardingHelperPath).href);

  const tag = `v${pkg.version}`;
  assert.equal(PINNED_RELEASE_TAG, tag);

  const shUrl = `https://github.com/nibras-platform/nibras/releases/download/${tag}/install.sh`;
  const ps1Url = `https://github.com/nibras-platform/nibras/releases/download/${tag}/install.ps1`;

  assert.match(getUnixInstallCommand(), new RegExp(shUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(getWindowsInstallCommand(), new RegExp(ps1Url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(studentGuide, new RegExp(shUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(readme, new RegExp(shUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
