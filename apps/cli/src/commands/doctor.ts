import { spawnSync } from 'node:child_process';
import { getGlobalConfigPath, readCliConfig } from '@nibras/core';
import picocolors from 'picocolors';
import { commandPing } from './ping';
import { emitJson } from '../util/output';

type DoctorCheck = {
  label: string;
  ok: boolean;
  value: string;
};

function commandExists(command: string): boolean {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], { encoding: 'utf8' });
  return result.status === 0;
}

function collectEnvironmentChecks(): DoctorCheck[] {
  const config = readCliConfig();
  const nodeVersion = process.version;
  const nodeOk = Number.parseInt(nodeVersion.slice(1), 10) >= 18;

  return [
    {
      label: 'Node.js',
      ok: nodeOk,
      value: `${nodeVersion}${nodeOk ? '' : ' (18+ recommended)'}`,
    },
    {
      label: 'git',
      ok: commandExists('git'),
      value: commandExists('git') ? 'installed' : 'not found',
    },
    {
      label: 'gh',
      ok: commandExists('gh'),
      value: commandExists('gh') ? 'installed' : 'optional — not found',
    },
    {
      label: 'Config file',
      ok: Boolean(config.apiBaseUrl),
      value: getGlobalConfigPath(),
    },
    {
      label: 'API base URL',
      ok: Boolean(config.apiBaseUrl),
      value: config.apiBaseUrl,
    },
    {
      label: 'Session',
      ok: Boolean(config.accessToken),
      value: config.accessToken ? 'signed in' : 'not signed in — run `nibras login`',
    },
  ];
}

function renderChecks(checks: DoctorCheck[], plain: boolean): void {
  for (const check of checks) {
    const icon = check.ok ? '✓' : '✗';
    if (plain) {
      console.log(`  ${icon} ${check.label}: ${check.value}`);
      continue;
    }
    const color = check.ok ? picocolors.green : picocolors.red;
    console.log(`  ${color(icon)} ${picocolors.dim(check.label + ':')} ${check.value}`);
  }
}

export async function commandDoctor(plain: boolean, json: boolean): Promise<void> {
  const checks = collectEnvironmentChecks();

  if (!json) {
    console.log(plain ? '\nEnvironment' : '\n  ' + picocolors.bold('Environment'));
    renderChecks(checks, plain);
    console.log(plain ? '\nConnectivity' : '\n  ' + picocolors.bold('Connectivity'));
  }

  if (json) {
    emitJson({
      environment: checks,
      note: 'Run `nibras ping` for live API/GitHub/project checks.',
    });
    return;
  }

  await commandPing(plain);
}
