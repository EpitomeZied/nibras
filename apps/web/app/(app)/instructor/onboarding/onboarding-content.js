import { discoverApiBaseUrlWith, normalizeApiBaseUrl } from '../../../lib/session-core.js';

export const PINNED_RELEASE_TAG = 'v2.0.0';
export const CLI_RELEASE_REPO = 'nibras-platform/nibras';
export const NPM_INSTALL_COMMAND = 'npm install -g @nibras/cli@2.0.0';

export function getReleaseInstallAssetUrl(tag, filename) {
  return `https://github.com/${CLI_RELEASE_REPO}/releases/download/${tag}/${filename}`;
}

/** One-line install for macOS, Linux, and Git Bash (uses GitHub release assets). */
export function getUnixInstallCommand(tag = PINNED_RELEASE_TAG) {
  const url = getReleaseInstallAssetUrl(tag, 'install.sh');
  return `curl -fsSL "${url}" | bash`;
}

/** One-line install for Windows PowerShell (uses GitHub release assets). */
export function getWindowsInstallCommand(tag = PINNED_RELEASE_TAG) {
  const url = getReleaseInstallAssetUrl(tag, 'install.ps1');
  return `irm "${url}" | iex`;
}

export function getInstallCommand(os, windowsShell = 'powershell', tag = PINNED_RELEASE_TAG) {
  if (os === 'windows') {
    if (windowsShell === 'gitbash') {
      return getUnixInstallCommand(tag);
    }
    return getWindowsInstallCommand(tag);
  }
  return getUnixInstallCommand(tag);
}

export function getOnboardingConfigPath(os) {
  if (os === 'windows') {
    return '%APPDATA%\\nibras\\config.json';
  }
  if (os === 'mac') {
    return '~/Library/Application Support/nibras/config.json';
  }
  return '~/.config/nibras/config.json';
}

export function getOnboardingDirExample(os, windowsShell = 'powershell') {
  if (os !== 'windows') {
    return 'nibras setup --project cs101/a1 --dir ~/projects/a1';
  }
  if (windowsShell === 'gitbash') {
    return 'nibras setup --project cs101/a1 --dir /c/projects/a1';
  }
  return 'nibras setup --project cs101/a1 --dir C:\\projects\\a1';
}

export function getInstallTroubleshootingCommand(os, windowsShell = 'powershell') {
  if (os === 'windows') {
    if (windowsShell === 'gitbash') {
      return `npm uninstall -g nibras @nibras/cli || true
prefix="$(npm config get prefix)"
rm -f "$prefix/nibras" "$prefix/nibras.cmd"
rm -rf "$(npm root -g)/nibras" "$(npm root -g)/@nibras/cli"
${NPM_INSTALL_COMMAND}`;
    }
    return `npm uninstall -g nibras @nibras/cli
Remove-Item "$((npm config get prefix).Trim())\\nibras.cmd" -Force -ErrorAction SilentlyContinue
Remove-Item "$((npm config get prefix).Trim())\\nibras" -Force -ErrorAction SilentlyContinue
Remove-Item "$((npm root -g).Trim())\\nibras" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$((npm root -g).Trim())\\@nibras\\cli" -Recurse -Force -ErrorAction SilentlyContinue
${NPM_INSTALL_COMMAND}`;
  }
  return `npm uninstall -g nibras @nibras/cli || true
rm -f "$(npm config get prefix)/bin/nibras"
rm -rf "$(npm root -g)/nibras" "$(npm root -g)/@nibras/cli"
${NPM_INSTALL_COMMAND}`;
}

export function buildHostedLoginCommand(apiBaseUrl) {
  const normalized = normalizeApiBaseUrl(apiBaseUrl);
  return `nibras login --api-base-url ${normalized || apiBaseUrl}`;
}

export function buildStudentQuickStart(apiBaseUrl, projectKey = 'cs101/assignment-1') {
  return [
    NPM_INSTALL_COMMAND,
    'nibras --version',
    buildHostedLoginCommand(apiBaseUrl),
    `nibras setup --project ${projectKey}`,
    'nibras test',
    'nibras submit',
  ].join('\n');
}

export async function discoverOnboardingApiBaseUrl({ configuredApiBaseUrl, pageOrigin, probe }) {
  return discoverApiBaseUrlWith({
    pageOrigin,
    storedApiBaseUrl: null,
    configuredApiBaseUrl,
    probe,
  });
}
