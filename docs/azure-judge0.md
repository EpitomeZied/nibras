# Judge0 IDE Sandbox on Azure

The `/ide` playground needs [Judge0 CE](https://github.com/judge0/judge0) to compile and run code. Judge0 requires **privileged Linux containers** (cgroup/isolate sandboxing), which **Azure Container Apps does not support**.

The supported Azure pattern is:

| Component | Where it runs |
|-----------|---------------|
| nibras-api, nibras-web, nibras-worker | Azure Container Apps (existing) |
| Judge0 (server + worker + Postgres + Redis) | Small **Azure VM** with Docker Compose |

## One-command setup

After completing [azure-deploy.md](./azure-deploy.md) steps 1–4 (resource group + Container Apps exist):

```bash
# From Azure Cloud Shell or any machine with `az login`
git clone https://github.com/NibrasPlatform/nibras-cli.git
cd nibras-cli
chmod +x scripts/provision-azure-judge0.sh
./scripts/provision-azure-judge0.sh
```

The script:

1. Creates an Ubuntu 22.04 VM (`Standard_B2s` by default) in `nibras-rg`
2. Installs Docker via cloud-init and starts Judge0 on port **2358**
3. Generates secure `AUTHN_TOKEN`, Redis, and Postgres passwords
4. Opens NSG port 2358
5. Sets `JUDGE0_API_URL` + `JUDGE0_AUTH_TOKEN` on the **nibras-api** Container App

### Custom settings

```bash
RG=nibras-rg \
LOCATION=westeurope \
VM_SIZE=Standard_B2s \
./scripts/provision-azure-judge0.sh
```

## Verify

```bash
# Judge0 directly (replace IP and token from script output)
curl -H "X-Auth-Token: YOUR_TOKEN" http://YOUR_VM_IP:2358/about

# Nibras API proxy
curl https://nibras-api.<your-env-domain>/v1/ide/status
# → {"configured":true,"reachable":true}
```

Open **https://nibras-web.\<your-env-domain\>/ide** and run code.

## Manual wiring (if script skipped the API step)

```bash
RG=nibras-rg
JUDGE0_URL='http://YOUR_VM_IP:2358'
JUDGE0_TOKEN='your-auth-token'

az containerapp secret set \
  --name nibras-api --resource-group $RG \
  --secrets "judge0-auth-token=$JUDGE0_TOKEN"

az containerapp update \
  --name nibras-api --resource-group $RG \
  --set-env-vars \
    "JUDGE0_API_URL=$JUDGE0_URL" \
    "JUDGE0_AUTH_TOKEN=secretref:judge0-auth-token" \
    "JUDGE0_CPU_TIME_LIMIT=5" \
    "JUDGE0_MEMORY_LIMIT=128000"
```

## Operations

**SSH into the VM:**

```bash
az ssh vm --resource-group nibras-rg --name nibras-judge0
cd /opt/nibras-judge0
docker compose ps
docker compose logs -f judge0-server
```

**Restart Judge0:**

```bash
cd /opt/nibras-judge0 && docker compose restart
```

**Teardown:**

```bash
az vm delete --resource-group nibras-rg --name nibras-judge0 --yes
# Remove the OS disk if orphaned:
az disk list --resource-group nibras-rg --query "[?contains(name,'nibras-judge0')].id" -o tsv | xargs -r az disk delete --yes
```

## Cost

| Resource | Approx. monthly |
|----------|-----------------|
| Standard_B2s VM (always on) | ~\$15–20 |
| Public IP | ~\$3 |

Use `Standard_B1s` for lighter workloads (~\$7/mo) — compiles will be slower.

## Security notes

- Judge0 is protected by `X-Auth-Token` on every request; the token is stored as a Container App secret, not in the browser.
- Port 2358 is publicly reachable by default so Container Apps can call it. For tighter lockdown, place the VM in a VNet peered with your Container Apps environment and restrict the NSG to internal traffic only.
- Do not expose Judge0 without `AUTHN_TOKEN` set.

## Why not Container Apps?

Azure Container Apps [does not support privileged containers](https://learn.microsoft.com/azure/container-apps/containers#container-requirements). Judge0 CE relies on privileged mode for its `isolate`-based sandbox. A VM (or AKS with privileged pods) is the practical Azure option.
