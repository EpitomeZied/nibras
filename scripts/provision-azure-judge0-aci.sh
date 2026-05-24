#!/usr/bin/env bash
# Deploy Judge0 on Azure Container Instances (privileged containers supported).
# Use this when Azure VM quota is unavailable (common on Azure for Students).
#
# Usage:
#   ./scripts/provision-azure-judge0-aci.sh
#   RG=nibras-rg LOCATION=francecentral ./scripts/provision-azure-judge0-aci.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT/infra/azure/judge0/aci-container-group.yaml"

RG="${RG:-nibras-rg}"
LOCATION="${LOCATION:-francecentral}"
API_APP_NAME="${API_APP_NAME:-nibras-api}"
ACI_NAME="${ACI_NAME:-nibras-judge0}"

echo "==> Deploying Judge0 on Azure Container Instances ($LOCATION)"

if ! az group show --name "$RG" >/dev/null 2>&1; then
  echo "Resource group '$RG' not found."
  exit 1
fi

echo "==> Ensuring Microsoft.ContainerInstance provider is registered"
az provider register --namespace Microsoft.ContainerInstance --wait --output none 2>/dev/null || true

if az container show --resource-group "$RG" --name "$ACI_NAME" >/dev/null 2>&1; then
  IP=$(az container show --resource-group "$RG" --name "$ACI_NAME" --query ipAddress.ip -o tsv)
  if [ "${FORCE_RECREATE:-}" != "1" ]; then
    echo "Container group '$ACI_NAME' already exists. IP: $IP"
    echo "Judge0 URL: http://${IP}:2358"
    echo "To upgrade resources: FORCE_RECREATE=1 $0"
    exit 0
  fi
  echo "==> Deleting existing container group for recreate"
  az container delete --resource-group "$RG" --name "$ACI_NAME" --yes --output none
fi

# Reuse existing API auth token when recreating so secrets stay in sync.
EXISTING_TOKEN=$(az containerapp secret show \
  --name "$API_APP_NAME" \
  --resource-group "$RG" \
  --secret-name judge0-auth-token \
  --query value -o tsv 2>/dev/null || true)

AUTHN_TOKEN="${JUDGE0_AUTH_TOKEN:-${EXISTING_TOKEN:-$(openssl rand -hex 32)}}"
REDIS_PASSWORD="${JUDGE0_REDIS_PASSWORD:-$(openssl rand -hex 16)}"
POSTGRES_PASSWORD="${JUDGE0_POSTGRES_PASSWORD:-$(openssl rand -hex 16)}"
SECRET_KEY_BASE="${JUDGE0_SECRET_KEY_BASE:-$(openssl rand -hex 32)}"

DEPLOY_YAML="$(mktemp)"
sed \
  -e "s/REPLACE_AUTHN_TOKEN/${AUTHN_TOKEN}/g" \
  -e "s/REPLACE_REDIS_PASSWORD/${REDIS_PASSWORD}/g" \
  -e "s/REPLACE_POSTGRES_PASSWORD/${POSTGRES_PASSWORD}/g" \
  -e "s/REPLACE_SECRET_KEY_BASE/${SECRET_KEY_BASE}/g" \
  -e "s/francecentral/${LOCATION}/g" \
  "$TEMPLATE" >"$DEPLOY_YAML"

echo "==> Creating container group (5 containers, 4 vCPU / ~8.5 GB — optimized for compile speed)"
az container create \
  --resource-group "$RG" \
  --file "$DEPLOY_YAML" \
  --output none

rm -f "$DEPLOY_YAML"

IP=$(az container show --resource-group "$RG" --name "$ACI_NAME" --query ipAddress.ip -o tsv)
JUDGE0_URL="http://${IP}:2358"

echo "==> Waiting for Judge0 at $JUDGE0_URL (up to 6 min)"
for i in $(seq 1 36); do
  if curl -sf --max-time 5 -H "X-Auth-Token: $AUTHN_TOKEN" "${JUDGE0_URL}/about" >/dev/null 2>&1; then
    echo "Judge0 is up."
    break
  fi
  if [ "$i" -eq 36 ]; then
    echo "WARN: Judge0 not responding yet. Check: az container logs --resource-group $RG --name $ACI_NAME --container-name judge0-server"
  fi
  sleep 10
done

if az containerapp show --name "$API_APP_NAME" --resource-group "$RG" >/dev/null 2>&1; then
  echo "==> Wiring nibras-api Container App"
  az containerapp secret set \
    --name "$API_APP_NAME" \
    --resource-group "$RG" \
    --secrets "judge0-auth-token=${AUTHN_TOKEN}" \
    --output none

  az containerapp update \
    --name "$API_APP_NAME" \
    --resource-group "$RG" \
    --set-env-vars \
      "JUDGE0_API_URL=${JUDGE0_URL}" \
      "JUDGE0_AUTH_TOKEN=secretref:judge0-auth-token" \
      "JUDGE0_CPU_TIME_LIMIT=5" \
      "JUDGE0_MEMORY_LIMIT=128000" \
    --output none

  echo "Restart nibras-api so secret changes take effect:"
  echo "  REV=\$(az containerapp revision list -n $API_APP_NAME -g $RG --query '[0].name' -o tsv)"
  echo "  az containerapp revision restart -n $API_APP_NAME -g $RG --revision \"\$REV\""
fi

cat <<EOF

================================================================================
Judge0 on Azure Container Instances — deployed
================================================================================
IP:         $IP
Judge0 URL: $JUDGE0_URL
Auth token: $AUTHN_TOKEN

Verify:
  curl -H "X-Auth-Token: $AUTHN_TOKEN" ${JUDGE0_URL}/about

Logs:
  az container logs -g $RG -n $ACI_NAME --container-name judge0-server

Teardown:
  az container delete -g $RG -n $ACI_NAME --yes
================================================================================
EOF
