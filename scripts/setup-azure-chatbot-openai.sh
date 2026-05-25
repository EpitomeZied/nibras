#!/usr/bin/env bash
# Update OpenAI API key for Hassona (nibras-chatbot-v1) on Azure Container Apps.
#
# Usage:
#   OPENAI_API_KEY='sk-...' ./scripts/setup-azure-chatbot-openai.sh
#
# Prerequisites: az login with Contributor on nibras-rg

set -euo pipefail

RG="${RG:-nibras-rg}"
APP="${APP:-nibras-chatbot-v1}"
KEY="${OPENAI_API_KEY:-${NIBRAS_AI_API_KEY:-}}"

if [ -z "$KEY" ]; then
  echo "error: set OPENAI_API_KEY (or NIBRAS_AI_API_KEY) in the environment." >&2
  echo "  Example: OPENAI_API_KEY='sk-...' $0" >&2
  exit 1
fi

echo "Verifying key against OpenAI..."
HTTP=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 \
  https://api.openai.com/v1/models \
  -H "Authorization: Bearer ${KEY}")
if [ "$HTTP" != "200" ]; then
  echo "error: OpenAI returned HTTP $HTTP — fix the key before deploying." >&2
  exit 1
fi
echo "  Key OK"

echo "Updating secret on $APP..."
az containerapp secret set \
  --name "$APP" \
  --resource-group "$RG" \
  --secrets "openai-api-key=${KEY}" \
  -o none

REV=$(az containerapp revision list -n "$APP" -g "$RG" --query "[0].name" -o tsv)
echo "Restarting revision $REV..."
az containerapp revision restart -n "$APP" -g "$RG" --revision "$REV" -o none

FQDN=$(az containerapp show -n "$APP" -g "$RG" \
  --query "properties.configuration.ingress.fqdn" -o tsv)
echo
echo "Waiting for tutor to answer a test question..."
for _ in 1 2 3 4 5 6 7 8 9 10; do
  RESP=$(curl -sS --max-time 30 -X POST "https://${FQDN}/api/ask" \
    -H "Content-Type: application/json" \
    -d '{"question":"What is Big-O notation?"}' || true)
  if echo "$RESP" | grep -q '"type":"ai"'; then
    echo "Hassona tutor is working."
    exit 0
  fi
  if echo "$RESP" | grep -qi "invalid api key\|401"; then
    echo "error: tutor still reports invalid API key — wait and retry or check logs." >&2
    exit 1
  fi
  sleep 5
done

echo "warning: test ask did not succeed yet — check logs:" >&2
echo "  az containerapp logs show -n $APP -g $RG --tail 30" >&2
exit 1
