# Install @nibras/cli globally via npm (Windows PowerShell).
#
# Quick install (after a release is published):
#   irm https://github.com/nibras-platform/nibras/releases/download/v@NIBRAS_CLI_VERSION@/install.ps1 | iex
#
# From a checkout:
#   powershell -ExecutionPolicy Bypass -File scripts/install.ps1

[CmdletBinding()]
param(
  [switch]$Check,
  [string]$Version,
  [switch]$Help
)

$ErrorActionPreference = 'Stop'

$DefaultVersion = '@NIBRAS_CLI_VERSION@'
$PackageScope = '@nibras/cli'
$MinNodeMajor = 18
$MinNpmMajor = 9

function Show-Usage {
  @'
Usage: install.ps1 [options]

Install the Nibras CLI globally using npm.

Options:
  -Check              Verify Node.js, npm, and git only (no install)
  -Version <ver>      Install a specific version (e.g. 2.0.0 or v2.0.0)
  -Help               Show this help

Environment:
  NIBRAS_VERSION      CLI version to install (default: release-pinned version)
'@ | Write-Host
}

function Resolve-NibrasVersion {
  if ($env:NIBRAS_VERSION -and $env:NIBRAS_VERSION -ne $DefaultVersion) {
    return $env:NIBRAS_VERSION.TrimStart('v')
  }
  if ($Version) {
    return $Version.TrimStart('v')
  }
  if ($DefaultVersion -ne '@NIBRAS_CLI_VERSION@') {
    return $DefaultVersion.TrimStart('v')
  }

  $pkgJson = Join-Path $PSScriptRoot '..\apps\cli\package.json'
  if ((Test-Path $pkgJson) -and (Get-Command node -ErrorAction SilentlyContinue)) {
    $fromPkg = node -p "require('$($pkgJson.Replace('\', '/'))').version" 2>$null
    if ($fromPkg) {
      return $fromPkg
    }
  }

  return '2.0.0'
}

function Test-VersionAtLeast {
  param(
    [string]$Current,
    [int]$RequiredMajor
  )
  $major = [int]($Current -split '\.' | Select-Object -First 1)
  return $major -ge $RequiredMajor
}

function Require-Command {
  param(
    [string]$Name,
    [string]$Hint
  )
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Error "error: '$Name' was not found on PATH.`n$Hint"
  }
}

function Test-Prerequisites {
  Require-Command node "Install Node.js $MinNodeMajor+ with winget: winget install OpenJS.NodeJS.LTS"
  Require-Command npm 'npm ships with Node.js — reinstall Node.js if npm is missing.'
  Require-Command git 'Install Git with winget: winget install Git.Git'

  $nodeVersion = (node -v).TrimStart('v')
  $npmVersion = npm -v

  if (-not (Test-VersionAtLeast $nodeVersion $MinNodeMajor)) {
    throw "error: Node.js v$MinNodeMajor+ is required (found v$nodeVersion)."
  }
  if (-not (Test-VersionAtLeast $npmVersion $MinNpmMajor)) {
    throw "error: npm v$MinNpmMajor+ is required (found v$npmVersion)."
  }
}

function Remove-StaleInstall {
  npm uninstall -g nibras $PackageScope 2>$null | Out-Null

  $prefix = (npm config get prefix).Trim()
  $globalRoot = (npm root -g).Trim()

  @(
    (Join-Path $prefix 'nibras.cmd'),
    (Join-Path $prefix 'nibras'),
    (Join-Path $globalRoot 'nibras'),
    (Join-Path $globalRoot '@nibras\cli')
  ) | ForEach-Object {
    if (Test-Path $_) {
      Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}

function Test-InstalledCli {
  param([string]$ExpectedVersion)

  if (Get-Command nibras -ErrorAction SilentlyContinue) {
    $installed = & nibras --version 2>$null
    Write-Host "Installed $installed (expected v$ExpectedVersion)."
    return
  }

  $prefix = (npm config get prefix).Trim()
  $candidate = Join-Path $prefix 'nibras.cmd'
  if (Test-Path $candidate) {
    Write-Warning "nibras was installed but is not on PATH."
    Write-Warning "Close this window, open a new PowerShell session, and ensure this folder is on PATH:"
    Write-Warning "  $prefix"
    return
  }

  throw "error: install finished but 'nibras' was not found."
}

if ($Help) {
  Show-Usage
  exit 0
}

$targetVersion = Resolve-NibrasVersion
$specifier = "$PackageScope@$targetVersion"

Write-Host 'Nibras CLI installer'
Write-Host "  Target: $specifier"
Write-Host

Test-Prerequisites

if ($Check) {
  $gitVersion = (git --version) -replace '^git version ', ''
  Write-Host "Prerequisites OK (Node $(node -v), npm $(npm -v), git $gitVersion)."
  exit 0
}

Write-Host 'Removing any previous global install...'
Remove-StaleInstall

Write-Host "Installing $specifier..."
npm install -g $specifier

Write-Host
Test-InstalledCli -ExpectedVersion $targetVersion
Write-Host
Write-Host 'Next steps:'
Write-Host '  nibras --version'
Write-Host '  nibras login --api-base-url https://your-nibras-instance.edu'
