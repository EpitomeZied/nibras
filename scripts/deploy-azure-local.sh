#!/usr/bin/env bash
# Deploy latest main build to Azure Container Apps using your local `az login`.
# Use when GitHub OIDC secrets cannot be created (e.g. university Entra ID tenant).
#
# Prerequisites:
#   - az login (Contributor on nibras-rg)
#   - Images already built by GitHub Actions (deploy-azure.yml build jobs)
#
# Usage:
#   ./scripts/deploy-azure-local.sh              # deploy HEAD of main from GitHub
#   ./scripts/deploy-azure-local.sh <git-sha>    # deploy a specific commit SHA

set -euo pipefail

RG="${RG:-nibras-rg}"
REPO="${REPO:-ghcr.io/epitomezied/nibras}"
GITHUB_REPO="${GITHUB_REPO:-EpitomeZied/nibras}"

SHA="${1:-}"
if [ -z "$SHA" ]; then
  SHA="$(gh api "repos/${GITHUB_REPO}/commits/main" --jq .sha 2>/dev/null || git rev-parse HEAD)"
fi

echo "Deploying $REPO/{api,worker,web}:$SHA to resource group $RG"
for svc in api worker web; do
  echo "  → nibras-$svc"
  az containerapp update \
    --name "nibras-$svc" \
    --resource-group "$RG" \
    --image "$REPO/$svc:$SHA" \
    -o none
done

echo
echo "Live URLs:"
for app in nibras-api nibras-web; do
  URL=$(az containerapp show --name "$app" -g "$RG" --query 'properties.configuration.ingress.fqdn' -o tsv)
  echo "  https://$URL"
done
echo "  https://nibrasplatform.me (custom domain on web)"
