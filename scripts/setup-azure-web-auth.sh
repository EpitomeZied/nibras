#!/usr/bin/env bash
# Wire Better Auth sign-in env vars on nibras-web (Azure Container Apps).
#
# Web sign-in needs GitHub OAuth credentials and BETTER_AUTH_SECRET on the **web**
# container (not only nibras-api). Magic-link email also needs RESEND_API_KEY on web —
# run scripts/setup-azure-email.sh after this if you use email sign-in.
#
# Usage:
#   ./scripts/setup-azure-web-auth.sh
#     Reads GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET, BETTER_AUTH_SECRET from .env
#
#   BETTER_AUTH_SECRET="$(openssl rand -base64 32)" ./scripts/setup-azure-web-auth.sh
#
# Optional:
#   RG=nibras-rg
#   NIBRAS_WEB_BASE_URL=https://nibrasplatform.me

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RG="${RG:-nibras-rg}"
NIBRAS_WEB_BASE_URL="${NIBRAS_WEB_BASE_URL:-https://nibrasplatform.me}"
APP="nibras-web"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

if [ -z "${GITHUB_APP_CLIENT_ID:-}" ] || [ -z "${GITHUB_APP_CLIENT_SECRET:-}" ]; then
  echo "error: GITHUB_APP_CLIENT_ID and GITHUB_APP_CLIENT_SECRET are required (same GitHub App as nibras-api)." >&2
  exit 1
fi

if [ -z "${BETTER_AUTH_SECRET:-}" ]; then
  read -rsp "Paste BETTER_AUTH_SECRET (or press Enter to generate): " BETTER_AUTH_SECRET
  echo
  if [ -z "${BETTER_AUTH_SECRET:-}" ]; then
    BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
    echo "Generated BETTER_AUTH_SECRET (save this backup securely):"
    echo "  $BETTER_AUTH_SECRET"
  fi
fi

echo "→ $APP"
az containerapp secret set \
  --name "$APP" \
  --resource-group "$RG" \
  --secrets \
    "github-app-client-id=$GITHUB_APP_CLIENT_ID" \
    "github-app-client-secret=$GITHUB_APP_CLIENT_SECRET" \
    "better-auth-secret=$BETTER_AUTH_SECRET"

az containerapp update \
  --name "$APP" \
  --resource-group "$RG" \
  --set-env-vars \
    "GITHUB_APP_CLIENT_ID=secretref:github-app-client-id" \
    "GITHUB_APP_CLIENT_SECRET=secretref:github-app-client-secret" \
    "BETTER_AUTH_SECRET=secretref:better-auth-secret" \
    "BETTER_AUTH_URL=$NIBRAS_WEB_BASE_URL" \
    "NIBRAS_WEB_BASE_URL=$NIBRAS_WEB_BASE_URL"

echo
echo "Done. Web auth env on $APP:"
echo "  GITHUB_APP_CLIENT_ID / GITHUB_APP_CLIENT_SECRET (secretref)"
echo "  BETTER_AUTH_SECRET (secretref)"
echo "  BETTER_AUTH_URL=$NIBRAS_WEB_BASE_URL"
echo
echo "For magic-link sign-in, also run: ./scripts/setup-azure-email.sh"
echo
echo "Verify:"
echo "  curl -sS \"${NIBRAS_WEB_BASE_URL}/api/auth/providers-config\""
