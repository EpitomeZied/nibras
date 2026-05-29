import {
  getGlobalConfigPath,
  patchCliConfig,
  readCliConfig,
} from '@nibras/core';
import picocolors from 'picocolors';
import { parseOption, requireNoUnknownFlags } from '../util/args';
import { emitJson } from '../util/output';

function printConfigHelp(): void {
  console.log(`Usage:
  nibras config path
  nibras config get [key]
  nibras config set <key> <value>

Keys:
  api-base-url    Hosted API base URL
  default-org     Default organization slug (optional)
  telemetry       true|false — usage telemetry opt-in

Examples:
  nibras config path
  nibras config get api-base-url
  nibras config set api-base-url https://nibras.example.edu
  nibras config set telemetry true`);
}

function getConfigValue(key: string): string | boolean | undefined {
  const config = readCliConfig();
  if (key === 'api-base-url') return config.apiBaseUrl;
  if (key === 'default-org') return config.defaultOrg;
  if (key === 'telemetry') return config.telemetryOptIn;
  throw new Error(`Unknown config key "${key}".`);
}

function setConfigValue(key: string, value: string): void {
  if (key === 'api-base-url') {
    patchCliConfig({ apiBaseUrl: value });
    return;
  }
  if (key === 'default-org') {
    patchCliConfig({ defaultOrg: value });
    return;
  }
  if (key === 'telemetry') {
    const normalized = value.toLowerCase();
    if (!['true', 'false', '1', '0', 'yes', 'no'].includes(normalized)) {
      throw new Error('telemetry must be true or false.');
    }
    patchCliConfig({ telemetryOptIn: ['true', '1', 'yes'].includes(normalized) });
    return;
  }
  throw new Error(`Unknown config key "${key}".`);
}

export async function commandConfig(args: string[], plain: boolean): Promise<void> {
  const json = args.includes('--json');
  const rest = args.filter((arg) => arg !== '--json' && arg !== '--plain');

  if (rest.length === 0 || rest[0] === '--help' || rest[0] === '-h') {
    printConfigHelp();
    return;
  }

  const subcommand = rest[0];
  const subArgs = rest.slice(1);
  requireNoUnknownFlags(subArgs, ['--help', '-h'], `config ${subcommand}`);

  if (subcommand === 'path') {
    const configPath = getGlobalConfigPath();
    if (json) {
      emitJson({ path: configPath });
      return;
    }
    console.log(plain ? configPath : picocolors.cyan(configPath));
    return;
  }

  if (subcommand === 'get') {
    const key = subArgs[0];
    if (!key || key === '--help' || key === '-h') {
      printConfigHelp();
      return;
    }
    const value = getConfigValue(key);
    if (json) {
      emitJson({ key, value: value ?? null });
      return;
    }
    console.log(value ?? '');
    return;
  }

  if (subcommand === 'set') {
    const key = subArgs[0];
    const value = subArgs[1];
    if (!key || !value) {
      throw new Error('Usage: nibras config set <key> <value>');
    }
    setConfigValue(key, value);
    if (json) {
      emitJson({ key, value: getConfigValue(key) ?? null });
      return;
    }
    console.log(plain ? `Updated ${key}.` : picocolors.green(`Updated ${key}.`));
    return;
  }

  throw new Error(`Unknown config subcommand "${subcommand}". Run \`nibras config --help\`.`);
}
