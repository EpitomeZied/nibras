#!/usr/bin/env bash
# Build and deploy Hassona (apps/tutor) to Azure Container Apps (nibras-chatbot-v1).
#
# Usage:
#   ./scripts/deploy-azure-chatbot.sh              # tag = current git SHA
#   ./scripts/deploy-azure-chatbot.sh <tag>        # explicit image tag
#
# Prerequisites: az login, docker, Contributor on nibras-rg

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RG="${RG:-nibras-rg}"
APP="${APP:-nibras-chatbot-v1}"
ACR="${ACR:-nibrascr}"
API_FQDN="${API_FQDN:-$(az containerapp show -n nibras-api -g "$RG" --query 'properties.configuration.ingress.fqdn' -o tsv)}"

TAG="${1:-$(git -C "$ROOT" rev-parse --short HEAD)}"
IMAGE="${ACR}.azurecr.io/nibras-chatbot-v1:${TAG}"

echo "Building $IMAGE from apps/tutor..."
az acr login --name "$ACR" -o none
docker build -t "$IMAGE" "$ROOT/apps/tutor"
docker push "$IMAGE"

echo "Updating $APP..."
az containerapp update \
  --name "$APP" \
  --resource-group "$RG" \
  --image "$IMAGE" \
  -o none

if [ -n "$API_FQDN" ]; then
  NIBRAS_API_URL="https://${API_FQDN}/v1/community"
  echo "Setting NIBRAS_API_URL=$NIBRAS_API_URL"
  az containerapp update \
    --name "$APP" \
    --resource-group "$RG" \
    --set-env-vars "NIBRAS_API_URL=${NIBRAS_API_URL}" \
    -o none
fi

FQDN=$(az containerapp show -n "$APP" -g "$RG" --query 'properties.configuration.ingress.fqdn' -o tsv)
echo
echo "Deployed: https://${FQDN}"
echo "Health:   curl -sS https://${FQDN}/api/health"
echo
echo "If Hassona still fails, refresh the OpenAI key:"
echo "  OPENAI_API_KEY='sk-...' ./scripts/setup-azure-chatbot-openai.sh"
