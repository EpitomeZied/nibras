#!/usr/bin/env bash
# Ensure NIBRAS_ENCRYPTION_KEY is configured on Azure Container Apps (api + worker).
# Required before students can save personal OpenAI keys (BYOK).
#
# Usage:
#   ./scripts/setup-azure-encryption-key.sh
#     Uses existing secret "encryption-key" if present; otherwise generates a new key.
#
#   NIBRAS_ENCRYPTION_KEY="$(openssl rand -hex 32)" ./scripts/setup-azure-encryption-key.sh
#     Sets or rotates the key (warning: rotating invalidates previously encrypted data).
#
# Prerequisites: az login, Contributor on nibras-rg

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RG="${RG:-nibras-rg}"
SECRET_NAME="${SECRET_NAME:-encryption-key}"
ENV_NAME="${ENV_NAME:-NIBRAS_ENCRYPTION_KEY}"

if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

validate_key() {
  local key="$1"
  if [ "${#key}" -ne 64 ]; then
    echo "error: NIBRAS_ENCRYPTION_KEY must be 64 hex characters (openssl rand -hex 32)." >&2
    exit 1
  fi
  if ! [[ "$key" =~ ^[0-9a-fA-F]{64}$ ]]; then
    echo "error: NIBRAS_ENCRYPTION_KEY must be hexadecimal." >&2
    exit 1
  fi
}

secret_exists() {
  az containerapp secret list -n nibras-api -g "$RG" --query "[?name=='$SECRET_NAME'].name" -o tsv 2>/dev/null | grep -q .
}

KEY="${NIBRAS_ENCRYPTION_KEY:-}"

if [ -n "$KEY" ]; then
  validate_key "$KEY"
  echo "Using NIBRAS_ENCRYPTION_KEY from environment."
elif secret_exists; then
  echo "Secret $SECRET_NAME already exists on nibras-api."
  echo "Re-binding env vars (no rotation). To rotate, run:"
  echo "  NIBRAS_ENCRYPTION_KEY=\$(openssl rand -hex 32) $0"
  KEY=""
else
  KEY="$(openssl rand -hex 32)"
  echo "Generated new encryption key (save this backup securely):"
  echo "  $KEY"
  validate_key "$KEY"
fi

for app in nibras-api nibras-worker; do
  echo "→ $app"
  if [ -n "$KEY" ]; then
    az containerapp secret set \
      --name "$app" \
      --resource-group "$RG" \
      --secrets "${SECRET_NAME}=${KEY}" \
      -o none
  fi

  az containerapp update \
    --name "$app" \
    --resource-group "$RG" \
    --set-env-vars "${ENV_NAME}=secretref:${SECRET_NAME}" \
    -o none
done

echo
echo "Done. ${ENV_NAME} is bound via secretref:${SECRET_NAME} on api + worker."
echo "After the next revision is active, verify:"
echo "  curl -sS https://\$(az containerapp show -n nibras-api -g $RG --query 'properties.configuration.ingress.fqdn' -o tsv)/readyz"
