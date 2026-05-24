#!/usr/bin/env bash
# Configure GitHub Actions → Azure Container Apps deploy auth (OIDC recommended).
#
# Usage (Azure Cloud Shell or any machine with `az login` + permission to register apps):
#   ./scripts/setup-azure-gha-credentials.sh
#
# Optional env overrides:
#   RG=nibras-rg
#   GITHUB_REPO=EpitomeZied/nibras
#   APP_NAME=nibras-gha

set -euo pipefail

RG="${RG:-nibras-rg}"
GITHUB_REPO="${GITHUB_REPO:-EpitomeZied/nibras}"
APP_NAME="${APP_NAME:-nibras-gha}"
BRANCH="${BRANCH:-main}"

SUB_ID="$(az account show --query id -o tsv)"
TENANT_ID="$(az account show --query tenantId -o tsv)"

echo "Subscription: $SUB_ID"
echo "Tenant:       $TENANT_ID"
echo "Resource grp: $RG"
echo "GitHub repo:  $GITHUB_REPO"
echo

create_sp() {
  if command -v docker >/dev/null 2>&1; then
    docker run --rm -v "$HOME/.azure:/root/.azure" mcr.microsoft.com/azure-cli:latest \
      az ad sp create-for-rbac \
      --name "$APP_NAME" \
      --role contributor \
      --scopes "/subscriptions/$SUB_ID/resourceGroups/$RG" \
      -o json
    return
  fi

  az ad sp create-for-rbac \
    --name "$APP_NAME" \
    --role contributor \
    --scopes "/subscriptions/$SUB_ID/resourceGroups/$RG" \
    -o json
}

echo "Creating (or reusing) service principal and federated credential for GitHub OIDC…"
if ! SP_JSON="$(create_sp 2>&1)"; then
  echo
  echo "Could not create an app registration / service principal automatically."
  echo "Your Entra ID tenant may block users from registering applications"
  echo "(common on university Azure for Students tenants)."
  echo
  echo "Ask an Entra ID administrator to do ONE of the following:"
  echo "  1. Entra ID → User settings → App registrations → allow users to register apps"
  echo "  2. Create an app registration manually, then re-run this script"
  echo
  echo "Manual portal steps (admin):"
  echo "  • Entra ID → App registrations → New registration → name: $APP_NAME"
  echo "  • Certificates & secrets → Federated credentials → GitHub Actions"
  echo "      Account: EpitomeZied"
  echo "      Repository:   nibras"
  echo "      Entity:       Branch"
  echo "      Branch:       $BRANCH"
  echo "  • Subscriptions → $SUB_ID → Resource groups → $RG → Access control (IAM)"
  echo "      Add role assignment → Contributor → assign to $APP_NAME"
  echo "  • Copy the Application (client) ID and run:"
  echo "      gh secret set AZURE_CLIENT_ID --body \"<client-id>\""
  echo "      gh secret set AZURE_TENANT_ID --body \"$TENANT_ID\""
  echo "      gh secret set AZURE_SUBSCRIPTION_ID --body \"$SUB_ID\""
  exit 1
fi

CLIENT_ID="$(echo "$SP_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['appId'])")"
OBJECT_ID="$(az ad sp show --id "$CLIENT_ID" --query id -o tsv)"

FED_NAME="github-${GITHUB_REPO//\//-}-${BRANCH}"
SUBJECT="repo:${GITHUB_REPO}:ref:refs/heads/${BRANCH}"

echo "Adding federated credential ($FED_NAME)…"
az ad app federated-credential create \
  --id "$CLIENT_ID" \
  --parameters "{
    \"name\": \"$FED_NAME\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"$SUBJECT\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" >/dev/null 2>&1 || echo "(Federated credential may already exist — continuing)"

echo
echo "GitHub secrets to set (requires gh CLI + repo admin):"
echo "  gh secret set AZURE_CLIENT_ID --body \"$CLIENT_ID\""
echo "  gh secret set AZURE_TENANT_ID --body \"$TENANT_ID\""
echo "  gh secret set AZURE_SUBSCRIPTION_ID --body \"$SUB_ID\""
echo
if command -v gh >/dev/null 2>&1; then
  read -r -p "Set these secrets on $GITHUB_REPO now? [y/N] " CONFIRM
  if [[ "${CONFIRM,,}" == "y" ]]; then
    gh secret set AZURE_CLIENT_ID --body "$CLIENT_ID" --repo "$GITHUB_REPO"
    gh secret set AZURE_TENANT_ID --body "$TENANT_ID" --repo "$GITHUB_REPO"
    gh secret set AZURE_SUBSCRIPTION_ID --body "$SUB_ID" --repo "$GITHUB_REPO"
    gh variable set AZURE_DEPLOY_AUTH --body "oidc" --repo "$GITHUB_REPO"
    echo "Secrets and AZURE_DEPLOY_AUTH=oidc updated."
  fi
fi

echo "Done. Push to main to trigger an automatic Container Apps deploy."
