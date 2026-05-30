#!/usr/bin/env bash
# Install @nibras/cli globally via npm (macOS, Linux, Git Bash on Windows).
#
# Quick install (after a release is published):
#   curl -fsSL https://github.com/nibras-platform/nibras/releases/download/v@NIBRAS_CLI_VERSION@/install.sh | bash
#
# From a checkout:
#   bash scripts/install.sh
#
# Override version:
#   NIBRAS_VERSION=2.0.0 bash scripts/install.sh

set -euo pipefail

DEFAULT_VERSION="@NIBRAS_CLI_VERSION@"
PACKAGE_SCOPE="@nibras/cli"
MIN_NODE_MAJOR=18
MIN_NPM_MAJOR=9

usage() {
  cat <<'EOF'
Usage: install.sh [options]

Install the Nibras CLI globally using npm.

Options:
  --check           Verify Node.js, npm, and git only (no install)
  --version <ver>   Install a specific version (e.g. 2.0.0 or v2.0.0)
  -h, --help        Show this help

Environment:
  NIBRAS_VERSION    CLI version to install (default: release-pinned version)
EOF
}

resolve_version() {
  if [[ -n "${NIBRAS_VERSION:-}" && "${NIBRAS_VERSION}" != "${DEFAULT_VERSION}" ]]; then
    echo "${NIBRAS_VERSION#v}"
    return
  fi

  if [[ "${DEFAULT_VERSION}" != '@NIBRAS_CLI_VERSION@' ]]; then
    echo "${DEFAULT_VERSION#v}"
    return
  fi

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  local pkg_json="${script_dir}/../apps/cli/package.json"
  if [[ -f "${pkg_json}" ]] && command -v node >/dev/null 2>&1; then
    node -p "require('${pkg_json}').version" 2>/dev/null && return
  fi

  echo "2.0.0"
}

version_ge() {
  # usage: version_ge 18 18  -> true if 18 >= 18
  local IFS=.
  local -a current=($1)
  local -a required=($2)
  local i
  for ((i = 0; i < ${#required[@]}; i++)); do
    local c="${current[i]:-0}"
    local r="${required[i]:-0}"
    if ((10#${c} > 10#${r})); then
      return 0
    fi
    if ((10#${c} < 10#${r})); then
      return 1
    fi
  done
  return 0
}

require_command() {
  local name="$1"
  local hint="$2"
  if ! command -v "${name}" >/dev/null 2>&1; then
    echo "error: '${name}' was not found on PATH." >&2
    echo "${hint}" >&2
    exit 1
  fi
}

check_prerequisites() {
  require_command node "Install Node.js ${MIN_NODE_MAJOR}+ from https://nodejs.org/ or use nvm: https://github.com/nvm-sh/nvm"
  require_command npm "npm ships with Node.js — reinstall Node.js if npm is missing."
  require_command git "Install git: https://git-scm.com/downloads"

  local node_major npm_major
  node_major="$(node -p "process.versions.node.split('.')[0]")"
  npm_major="$(npm -v | cut -d. -f1)"

  if ! version_ge "${node_major}" "${MIN_NODE_MAJOR}"; then
    echo "error: Node.js v${MIN_NODE_MAJOR}+ is required (found v$(node -v | sed 's/^v//'))." >&2
    exit 1
  fi

  if ! version_ge "${npm_major}" "${MIN_NPM_MAJOR}"; then
    echo "error: npm v${MIN_NPM_MAJOR}+ is required (found v$(npm -v))." >&2
    exit 1
  fi
}

cleanup_stale_install() {
  npm uninstall -g nibras "${PACKAGE_SCOPE}" >/dev/null 2>&1 || true

  local prefix global_root
  prefix="$(npm config get prefix 2>/dev/null || true)"
  global_root="$(npm root -g 2>/dev/null || true)"

  if [[ -n "${prefix}" && "${prefix}" != "undefined" ]]; then
    rm -f "${prefix}/bin/nibras" "${prefix}/nibras" "${prefix}/nibras.cmd" 2>/dev/null || true
  fi

  if [[ -n "${global_root}" && "${global_root}" != "undefined" ]]; then
    rm -rf "${global_root}/nibras" "${global_root}/@nibras/cli" 2>/dev/null || true
  fi
}

global_bin_dir() {
  local prefix
  prefix="$(npm config get prefix 2>/dev/null || true)"
  if [[ -z "${prefix}" || "${prefix}" == "undefined" ]]; then
    return 1
  fi
  if [[ "${OSTYPE:-}" == msys* || "${OSTYPE:-}" == cygwin* ]]; then
    echo "${prefix}"
  else
    echo "${prefix}/bin"
  fi
}

verify_install() {
  local version="$1"
  if command -v nibras >/dev/null 2>&1; then
    local installed
    installed="$(nibras --version 2>/dev/null || true)"
    echo "Installed ${installed:-nibras} (expected v${version})."
    return 0
  fi

  local bin_dir
  if ! bin_dir="$(global_bin_dir)"; then
    echo "warning: could not locate the npm global bin directory." >&2
    return 1
  fi

  if [[ -x "${bin_dir}/nibras" || -f "${bin_dir}/nibras.cmd" ]]; then
    echo "warning: nibras was installed but is not on PATH." >&2
    echo "Add this directory to PATH, then open a new terminal:" >&2
    echo "  ${bin_dir}" >&2
    return 1
  fi

  echo "error: install finished but 'nibras' was not found." >&2
  return 1
}

main() {
  local check_only=0
  local version_override=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --check)
        check_only=1
        shift
        ;;
      --version)
        shift
        version_override="${1:-}"
        if [[ -z "${version_override}" ]]; then
          echo "error: --version requires a value." >&2
          exit 1
        fi
        shift
        ;;
      -h | --help)
        usage
        exit 0
        ;;
      *)
        echo "error: unknown argument '$1'." >&2
        usage >&2
        exit 1
        ;;
    esac
  done

  if [[ -n "${version_override}" ]]; then
    NIBRAS_VERSION="${version_override#v}"
  fi

  local version
  version="$(resolve_version)"
  local specifier="${PACKAGE_SCOPE}@${version}"

  echo "Nibras CLI installer"
  echo "  Target: ${specifier}"
  echo

  check_prerequisites

  if [[ "${check_only}" -eq 1 ]]; then
    echo "Prerequisites OK (Node $(node -v), npm $(npm -v), git $(git --version | cut -d' ' -f3))."
    exit 0
  fi

  echo "Removing any previous global install..."
  cleanup_stale_install

  echo "Installing ${specifier}..."
  npm install -g "${specifier}"

  echo
  verify_install "${version}" || true
  echo
  echo "Next steps:"
  echo "  nibras --version"
  echo "  nibras login --api-base-url https://your-nibras-instance.edu"
}

main "$@"
