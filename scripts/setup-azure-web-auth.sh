#!/usr/bin/env bash
# Wire Better Auth sign-in env vars on nibras-web (Azure Container Apps).
#
# Web sign-in needs: GitHub OAuth, BETTER_AUTH_SECRET, DATABASE_URL (Prisma),
# RESEND_API_KEY + NIBRAS_EMAIL_FROM (magic link). Copies from nibras-api when .env is empty.
#
# Usage:
#   ./scripts/setup-azure-web-auth.sh
#
# Optional:
#   RG=nibras-rg
#   API_APP=nibras-api
#   NIBRAS_WEB_BASE_URL=https://nibrasplatform.me

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RG="${RG:-nibras-rg}"
API_APP="${API_APP:-nibras-api}"
APP="nibras-web"
NIBRAS_WEB_BASE_URL="${NIBRAS_WEB_BASE_URL:-https://nibrasplatform.me}"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

read_api_secret() {
  az containerapp secret show \
    -n "$API_APP" \
    -g "$RG" \
    --secret-name "$1" \
    --query value \
    -o tsv 2>/dev/null || true
}

read_web_secret() {
  az containerapp secret show \
    -n "$APP" \
    -g "$RG" \
    --secret-name "$1" \
    --query value \
    -o tsv 2>/dev/null || true
}

if [ -z "${GITHUB_APP_CLIENT_ID:-}" ] || [ -z "${GITHUB_APP_CLIENT_SECRET:-}" ]; then
  echo "GITHUB_APP_CLIENT_* not in .env — copying from $API_APP secrets…"
  GITHUB_APP_CLIENT_ID="$(read_api_secret github-app-client-id)"
  GITHUB_APP_CLIENT_SECRET="$(read_api_secret github-app-client-secret)"
fi

if [ -z "${GITHUB_APP_CLIENT_ID:-}" ] || [ -z "${GITHUB_APP_CLIENT_SECRET:-}" ]; then
  echo "error: could not resolve GitHub app credentials (set in .env or on $API_APP)." >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  DATABASE_URL="$(read_api_secret database-url)"
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "error: could not resolve DATABASE_URL (required for Better Auth on web)." >&2
  exit 1
fi

if [ -z "${RESEND_API_KEY:-}" ]; then
  RESEND_API_KEY="$(read_api_secret resend-api-key)"
fi

if [ -z "${BETTER_AUTH_SECRET:-}" ]; then
  existing="$(read_web_secret better-auth-secret)"
  if [ -n "$existing" ]; then
    BETTER_AUTH_SECRET="$existing"
    echo "Reusing existing better-auth-secret on $APP."
  else
    BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
    echo "Generated BETTER_AUTH_SECRET (save this backup securely):"
    echo "  $BETTER_AUTH_SECRET"
  fi
fi

EMAIL_FROM="$(az containerapp show -n "$API_APP" -g "$RG" \
  --query "properties.template.containers[0].env[?name=='NIBRAS_EMAIL_FROM'].value | [0]" -o tsv 2>/dev/null || true)"
EMAIL_FROM="${EMAIL_FROM:-${NIBRAS_EMAIL_FROM:-Nibras <noreply@nibrasplatform.me>}}"

echo "→ $APP"
SECRET_ARGS=(
  "github-app-client-id=$GITHUB_APP_CLIENT_ID"
  "github-app-client-secret=$GITHUB_APP_CLIENT_SECRET"
  "better-auth-secret=$BETTER_AUTH_SECRET"
  "database-url=$DATABASE_URL"
)
if [ -n "${RESEND_API_KEY:-}" ]; then
  SECRET_ARGS+=("resend-api-key=$RESEND_API_KEY")
fi

az containerapp secret set \
  --name "$APP" \
  --resource-group "$RG" \
  --secrets "${SECRET_ARGS[@]}" \
  -o none

ENV_VARS=(
  "GITHUB_APP_CLIENT_ID=secretref:github-app-client-id"
  "GITHUB_APP_CLIENT_SECRET=secretref:github-app-client-secret"
  "BETTER_AUTH_SECRET=secretref:better-auth-secret"
  "DATABASE_URL=secretref:database-url"
  "BETTER_AUTH_URL=$NIBRAS_WEB_BASE_URL"
  "NIBRAS_WEB_BASE_URL=$NIBRAS_WEB_BASE_URL"
  "NIBRAS_EMAIL_FROM=$EMAIL_FROM"
)
if [ -n "${RESEND_API_KEY:-}" ]; then
  ENV_VARS+=("RESEND_API_KEY=secretref:resend-api-key")
fi

az containerapp update \
  --name "$APP" \
  --resource-group "$RG" \
  --set-env-vars "${ENV_VARS[@]}" \
  -o none

echo
echo "Done. Web auth env on $APP:"
echo "  DATABASE_URL (secretref) — required for sign-in"
echo "  GITHUB_APP_CLIENT_ID / GITHUB_APP_CLIENT_SECRET (secretref)"
echo "  BETTER_AUTH_SECRET (secretref)"
echo "  BETTER_AUTH_URL=$NIBRAS_WEB_BASE_URL"
echo "  NIBRAS_EMAIL_FROM=$EMAIL_FROM"
if [ -n "${RESEND_API_KEY:-}" ]; then
  echo "  RESEND_API_KEY (secretref)"
else
  echo "  RESEND_API_KEY not set — run ./scripts/setup-azure-email.sh for magic link"
fi
echo
echo "GitHub App → add OAuth callback (if missing):"
echo "  ${NIBRAS_WEB_BASE_URL}/api/auth/callback/github"
echo
echo "Wait ~30s, then verify:"
echo "  curl -sS -X POST \"${NIBRAS_WEB_BASE_URL}/api/auth/sign-in/magic-link\" \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"you@example.com\",\"callbackURL\":\"${NIBRAS_WEB_BASE_URL}/api/nibras/session-bridge\"}'"
