#!/usr/bin/env node
'use strict';

const REQUIRED = [
  'DATABASE_URL',
  'NIBRAS_ENCRYPTION_KEY',
  'GITHUB_APP_ID',
  'GITHUB_APP_CLIENT_ID',
  'GITHUB_APP_CLIENT_SECRET',
  'GITHUB_APP_PRIVATE_KEY',
  'GITHUB_APP_NAME',
  'GITHUB_WEBHOOK_SECRET',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'NIBRAS_WEB_BASE_URL',
  'NEXT_PUBLIC_NIBRAS_API_BASE_URL',
  'NEXT_PUBLIC_NIBRAS_WEB_BASE_URL',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n❌  Missing required environment variables:\n');
  missing.forEach((key) => console.error(`   • ${key}`));
  console.error('\nSet these in your .env file or deployment environment.\n');
  process.exit(1);
}

const encKey = process.env.NIBRAS_ENCRYPTION_KEY?.trim();
if (encKey) {
  const bytes = Buffer.from(encKey, 'hex');
  if (bytes.length !== 32) {
    console.error(
      '\n❌  NIBRAS_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with:\n'
    );
    console.error('     openssl rand -hex 32\n');
    process.exit(1);
  }
}

// Semantic warnings for common deployment mistakes
let warnings = 0;

if (process.env.HOST && process.env.HOST !== '0.0.0.0') {
  console.warn('⚠️  HOST is "%s" — should be 0.0.0.0 for Docker deployments', process.env.HOST);
  warnings++;
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@db:')) {
  console.warn(
    '⚠️  DATABASE_URL uses hostname "db" — docker-compose.prod.yml names the service "postgres"'
  );
  warnings++;
}

if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@127.0.0.1:')) {
  console.warn(
    '⚠️  DATABASE_URL uses 127.0.0.1 — use the Docker service name (e.g. "postgres") in containers'
  );
  warnings++;
}

function hostnameFromUrl(value) {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

const apiPublicHost = hostnameFromUrl(process.env.NEXT_PUBLIC_NIBRAS_API_BASE_URL);
const webPublicHost = hostnameFromUrl(process.env.NIBRAS_WEB_BASE_URL);
if (apiPublicHost && webPublicHost && apiPublicHost !== webPublicHost) {
  console.warn(
    '⚠️  NEXT_PUBLIC_NIBRAS_API_BASE_URL host (%s) differs from NIBRAS_WEB_BASE_URL host (%s) — ensure the API host is reachable and NIBRAS_WEB_CORS_ORIGINS includes the web origin',
    apiPublicHost,
    webPublicHost
  );
  warnings++;
}

if (warnings > 0) {
  console.warn('\n%d warning(s) above — review before deploying.\n', warnings);
}

console.log('✓  All required environment variables are set.');
