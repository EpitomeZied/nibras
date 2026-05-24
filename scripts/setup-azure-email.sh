#!/usr/bin/env bash
# Wire Resend email env vars on nibras-api and nibras-worker (Azure Container Apps).
#
# Usage:
#   RESEND_API_KEY=re_... ./scripts/setup-azure-email.sh
#
# Or add RESEND_API_KEY to nibras/.env, then:
#   ./scripts/setup-azure-email.sh
#
# Optional:
#   RG=nibras-rg
#   NIBRAS_EMAIL_FROM='Nibras <noreply@nibrasplatform.me>'
#   NIBRAS_WEB_BASE_URL=https://nibrasplatform.me

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RG="${RG:-nibras-rg}"
NIBRAS_EMAIL_FROM="${NIBRAS_EMAIL_FROM:-Nibras <noreply@nibrasplatform.me>}"
NIBRAS_WEB_BASE_URL="${NIBRAS_WEB_BASE_URL:-https://nibrasplatform.me}"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

if [ -z "${RESEND_API_KEY:-}" ]; then
  read -rsp "Paste Resend API key (re_...): " RESEND_API_KEY
  echo
fi

if [ -z "${RESEND_API_KEY:-}" ]; then
  echo "error: RESEND_API_KEY is required" >&2
  exit 1
fi

if [[ ! "$RESEND_API_KEY" =~ ^re_ ]]; then
  echo "warning: key does not start with re_ — continuing anyway" >&2
fi

for app in nibras-api nibras-worker; do
  echo "→ $app"
  az containerapp secret set \
    --name "$app" \
    --resource-group "$RG" \
    --secrets "resend-api-key=$RESEND_API_KEY"

  az containerapp update \
    --name "$app" \
    --resource-group "$RG" \
    --set-env-vars \
      "RESEND_API_KEY=secretref:resend-api-key" \
      "NIBRAS_EMAIL_FROM=$NIBRAS_EMAIL_FROM" \
      "NIBRAS_WEB_BASE_URL=$NIBRAS_WEB_BASE_URL"
done

echo
echo "Done. Email env on api + worker:"
echo "  NIBRAS_EMAIL_FROM=$NIBRAS_EMAIL_FROM"
echo "  NIBRAS_WEB_BASE_URL=$NIBRAS_WEB_BASE_URL"
echo
echo "Verify in Resend → Emails after a test submission or review."
echo "Worker min replicas should stay ≥ 1 (current scale):"
az containerapp show -n nibras-worker -g "$RG" \
  --query "properties.template.scale.minReplicas" -o tsv
