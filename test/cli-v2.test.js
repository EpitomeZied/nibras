const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const { buildApp } = require('../apps/api/dist/app');
const { FileStore } = require('../apps/api/dist/store');

const repoRoot = path.resolve(__dirname, '..');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nibras-cli-v2-'));
}

async function startApi(storePath) {
  const previousStore = process.env.NIBRAS_API_STORE;
  process.env.NIBRAS_API_STORE = storePath;
  const app = buildApp(new FileStore(storePath));
  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  const apiBaseUrl = `http://127.0.0.1:${address.port}`;
  return {
    apiBaseUrl,
    close: async () => {
      await app.close();
      if (previousStore === undefined) {
        delete process.env.NIBRAS_API_STORE;
      } else {
        process.env.NIBRAS_API_STORE = previousStore;
      }
    },
  };
}

async function createSession(apiBaseUrl) {
  const started = await fetch(`${apiBaseUrl}/v1/device/start`, {
    method: 'POST',
  }).then((response) => response.json());
  await fetch(started.verificationUriComplete);
  return fetch(`${apiBaseUrl}/v1/device/poll`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceCode: started.deviceCode }),
  }).then((response) => response.json());
}

function writeCliConfig(configRoot, apiBaseUrl, session) {
  const configDir = path.join(configRoot, 'nibras');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, 'config.json'),
    JSON.stringify(
      {
        apiBaseUrl,
        activeUserId: session.user.id,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
      null,
      2
    )
  );
}

function runCli(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(repoRoot, 'bin', 'nibras.js'), ...args], {
      cwd: options.cwd || repoRoot,
      env: {
        ...process.env,
        ...(options.env || {}),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ status: code, stdout, stderr });
    });
  });
}

test('CLI v2 help lists config, doctor, and milestones', async () => {
  const result = await runCli(['--plain']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /config\s/);
  assert.match(result.stdout, /doctor\s/);
  assert.match(result.stdout, /milestones\s/);
  assert.match(result.stdout, /--json/);
});

test('CLI v2 config path prints the resolved config file', async () => {
  const tmp = makeTempDir();
  const configRoot = path.join(tmp, 'config');
  const result = await runCli(['config', 'path', '--plain'], {
    env: { XDG_CONFIG_HOME: configRoot },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout.trim(), /config\.json$/);
});

test('CLI v2 whoami supports --json output', async () => {
  const tmp = makeTempDir();
  const configRoot = path.join(tmp, 'config');
  const server = await startApi(path.join(tmp, 'store.json'));
  try {
    const session = await createSession(server.apiBaseUrl);
    writeCliConfig(configRoot, server.apiBaseUrl, session);
    const result = await runCli(['whoami', '--json'], {
      env: { XDG_CONFIG_HOME: configRoot },
    });
    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.user.id, session.user.id);
    assert.equal(payload.apiBaseUrl, server.apiBaseUrl);
  } finally {
    await server.close();
  }
});

test('CLI v2 list --json returns course data', async () => {
  const tmp = makeTempDir();
  const configRoot = path.join(tmp, 'config');
  const server = await startApi(path.join(tmp, 'store.json'));
  try {
    const session = await createSession(server.apiBaseUrl);
    writeCliConfig(configRoot, server.apiBaseUrl, session);
    const result = await runCli(['list', '--json'], {
      env: { XDG_CONFIG_HOME: configRoot },
    });
    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.ok(Array.isArray(payload.courses));
  } finally {
    await server.close();
  }
});
