#!/usr/bin/env bash
# Provision Judge0 CE on an Azure VM and wire nibras-api Container App to it.
#
# Judge0 needs privileged Docker (cgroup/isolate sandboxing), which Azure Container
# Apps does not support — so we run the full stack on a small Linux VM instead.
#
# Prerequisites:
#   - az CLI logged in (az login)
#   - Resource group + Container Apps env already exist (see docs/azure-deploy.md)
#   - nibras-api Container App already created
#
# Usage:
#   ./scripts/provision-azure-judge0.sh
#   RG=nibras-rg LOCATION=westeurope ./scripts/provision-azure-judge0.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RG="${RG:-nibras-rg}"
LOCATION="${LOCATION:-westeurope}"
VM_NAME="${VM_NAME:-nibras-judge0}"
VM_SIZE="${VM_SIZE:-Standard_B2s}"
API_APP_NAME="${API_APP_NAME:-nibras-api}"
ADMIN_USER="${ADMIN_USER:-azureuser}"
JUDGE0_DIR="/opt/nibras-judge0"

echo "==> Provisioning Judge0 on Azure VM in resource group: $RG"

if ! az group show --name "$RG" >/dev/null 2>&1; then
  echo "Resource group '$RG' not found. Create it first (docs/azure-deploy.md step 3)."
  exit 1
fi

if az vm show --resource-group "$RG" --name "$VM_NAME" >/dev/null 2>&1; then
  echo "VM '$VM_NAME' already exists in $RG."
  PUBLIC_IP=$(az vm show -d --resource-group "$RG" --name "$VM_NAME" --query publicIps -o tsv)
  echo "Public IP: $PUBLIC_IP"
  echo "Judge0 URL: http://${PUBLIC_IP}:2358"
  echo "Re-run with a different VM_NAME to create another instance, or SSH in to manage the existing VM."
  exit 0
fi

AUTHN_TOKEN="${JUDGE0_AUTH_TOKEN:-$(openssl rand -hex 32)}"
REDIS_PASSWORD="${JUDGE0_REDIS_PASSWORD:-$(openssl rand -hex 16)}"
POSTGRES_PASSWORD="${JUDGE0_POSTGRES_PASSWORD:-$(openssl rand -hex 16)}"
SECRET_KEY_BASE="${JUDGE0_SECRET_KEY_BASE:-$(openssl rand -hex 32)}"

CLOUD_INIT="$(mktemp)"
COMPOSE_FILE="$ROOT/infra/azure/judge0/docker-compose.yml"

cat >"$CLOUD_INIT" <<EOF
#cloud-config
package_update: true
package_upgrade: false

write_files:
  - path: ${JUDGE0_DIR}/judge0.conf
    permissions: '0644'
    content: |
      AUTHN_TOKEN=${AUTHN_TOKEN}
      REDIS_HOST=redis
      REDIS_PASSWORD=${REDIS_PASSWORD}
      POSTGRES_HOST=db
      POSTGRES_DB=judge0
      POSTGRES_USER=judge0
      POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      SECRET_KEY_BASE=${SECRET_KEY_BASE}
      CPU_TIME_LIMIT=5
      MAX_CPU_TIME_LIMIT=15
      WALL_TIME_LIMIT=10
      MEMORY_LIMIT=128000
      MAX_MEMORY_LIMIT=512000
      ENABLE_NETWORK=false
      JUDGE0_TELEMETRY_ENABLE=false

  - path: ${JUDGE0_DIR}/docker-compose.yml
    permissions: '0644'
    content: |
$(sed 's/^/      /' "$COMPOSE_FILE")

runcmd:
  - curl -fsSL https://get.docker.com | sh
  - usermod -aG docker ${ADMIN_USER}
  - systemctl enable docker
  - systemctl start docker
  - cd ${JUDGE0_DIR} && docker compose up -d
EOF

echo "==> Creating VM ($VM_SIZE) — first boot installs Docker and starts Judge0 (~5 min)"
az vm create \
  --resource-group "$RG" \
  --name "$VM_NAME" \
  --location "$LOCATION" \
  --image Ubuntu2204 \
  --size "$VM_SIZE" \
  --admin-username "$ADMIN_USER" \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --custom-data "$CLOUD_INIT" \
  --output none

echo "==> Opening port 2358 (Judge0 API) on the VM NSG"
NSG=$(az network nic list --resource-group "$RG" --query "[?contains(name,'${VM_NAME}')].networkSecurityGroup.id" -o tsv | head -1)
if [ -n "$NSG" ]; then
  NSG_NAME=$(basename "$NSG")
  az network nsg rule create \
    --resource-group "$RG" \
    --nsg-name "$NSG_NAME" \
    --name allow-judge0 \
    --priority 1001 \
    --destination-port-ranges 2358 \
    --access Allow \
    --protocol Tcp \
    --output none 2>/dev/null || true
fi

PUBLIC_IP=$(az vm show -d --resource-group "$RG" --name "$VM_NAME" --query publicIps -o tsv)
JUDGE0_URL="http://${PUBLIC_IP}:2358"

echo "==> Waiting for Judge0 to become reachable at $JUDGE0_URL (up to 8 min)"
for i in $(seq 1 48); do
  if curl -sf --max-time 5 "${JUDGE0_URL}/about" >/dev/null 2>&1; then
    echo "Judge0 is up."
    break
  fi
  if [ "$i" -eq 48 ]; then
    echo "WARN: Judge0 not responding yet. Cloud-init may still be running."
    echo "SSH: az ssh vm --resource-group $RG --name $VM_NAME"
    echo "Then: cd $JUDGE0_DIR && docker compose ps"
  fi
  sleep 10
done

if az containerapp show --name "$API_APP_NAME" --resource-group "$RG" >/dev/null 2>&1; then
  echo "==> Wiring nibras-api Container App to Judge0"
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

  echo "nibras-api updated with JUDGE0_API_URL=$JUDGE0_URL"
else
  echo "WARN: Container App '$API_APP_NAME' not found — set env vars manually:"
fi

rm -f "$CLOUD_INIT"

cat <<EOF

================================================================================
Judge0 on Azure — provisioned
================================================================================
VM:           $VM_NAME
Public IP:    $PUBLIC_IP
Judge0 URL:   $JUDGE0_URL
Auth token:   $AUTHN_TOKEN   (also stored as nibras-api secret judge0-auth-token)

Verify:
  curl -H "X-Auth-Token: $AUTHN_TOKEN" ${JUDGE0_URL}/about
  curl https://nibras-api.<your-env-domain>/v1/ide/status

Cost: ~\$15–20/mo for Standard_B2s (B1s is cheaper but slower for compile jobs).

Security: port 2358 is open to the internet but requires X-Auth-Token on every
request. Restrict the NSG to your API egress IPs for tighter lockdown.

Teardown:
  az vm delete --resource-group $RG --name $VM_NAME --yes
================================================================================
EOF
