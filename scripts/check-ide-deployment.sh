#!/usr/bin/env bash
# Health check for IDE / Judge0 deployment (Azure + optional local).
set -euo pipefail

RG="${RG:-nibras-rg}"
API_APP="${API_APP:-nibras-api}"
ACI_NAME="${ACI_NAME:-nibras-judge0}"
FAIL=0

pass() { echo "  OK   $1"; }
fail() { echo "  FAIL $1"; FAIL=1; }

echo "==> Nibras IDE deployment check"
echo

echo "Container Apps ($RG):"
for app in nibras-api nibras-web nibras-worker; do
  STATE=$(az containerapp show -g "$RG" -n "$app" --query 'properties.runningStatus' -o tsv 2>/dev/null || echo missing)
  if [ "$STATE" = "Running" ]; then pass "$app ($STATE)"; else fail "$app ($STATE)"; fi
done

API_FQDN=$(az containerapp show -g "$RG" -n "$API_APP" --query 'properties.configuration.ingress.fqdn' -o tsv 2>/dev/null || true)
WEB_FQDN=$(az containerapp show -g "$RG" -n nibras-web --query 'properties.configuration.ingress.fqdn' -o tsv 2>/dev/null || true)

echo
echo "API endpoints:"
if [ -n "$API_FQDN" ]; then
  if curl -sf --max-time 10 "https://${API_FQDN}/healthz" >/dev/null; then
    pass "https://${API_FQDN}/healthz"
  else
    fail "https://${API_FQDN}/healthz"
  fi

  STATUS=$(curl -sf --max-time 10 "https://${API_FQDN}/v1/ide/status" 2>/dev/null || echo '{}')
  if echo "$STATUS" | grep -q '"configured":true'; then pass "/v1/ide/status configured"; else fail "/v1/ide/status configured ($STATUS)"; fi
  if echo "$STATUS" | grep -q '"reachable":true'; then pass "/v1/ide/status reachable"; else fail "/v1/ide/status reachable ($STATUS)"; fi
else
  fail "nibras-api FQDN not found"
fi

echo
echo "Judge0 (Azure Container Instances):"
if az container show -g "$RG" -n "$ACI_NAME" >/dev/null 2>&1; then
  ACI_STATE=$(az container show -g "$RG" -n "$ACI_NAME" --query 'instanceView.state' -o tsv)
  ACI_IP=$(az container show -g "$RG" -n "$ACI_NAME" --query 'ipAddress.ip' -o tsv)
  if [ "$ACI_STATE" = "Running" ]; then pass "$ACI_NAME ($ACI_STATE @ $ACI_IP)"; else fail "$ACI_NAME ($ACI_STATE)"; fi

  J0_URL=$(az containerapp show -g "$RG" -n "$API_APP" --query "properties.template.containers[0].env[?name=='JUDGE0_API_URL'].value" -o tsv 2>/dev/null || true)
  if [ -n "$J0_URL" ]; then pass "API JUDGE0_API_URL=$J0_URL"; else fail "API JUDGE0_API_URL not set"; fi
else
  fail "$ACI_NAME not found"
fi

echo
echo "Web app:"
if [ -n "$WEB_FQDN" ]; then
  if curl -sf --max-time 15 -o /dev/null "https://${WEB_FQDN}/ide"; then
    pass "https://${WEB_FQDN}/ide"
  else
  fail "https://${WEB_FQDN}/ide (may require auth — check manually)"
  fi
fi

echo
echo "Local Judge0 (optional):"
if curl -sf --max-time 3 -H "X-Auth-Token: nibras-judge0-dev-token" http://127.0.0.1:2358/about >/dev/null 2>&1; then
  pass "localhost:2358"
else
  echo "  skip localhost:2358 (not running or no token)"
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Some checks failed."
  exit 1
fi
