# Operations Guide

This guide covers deploying, monitoring, and maintaining a production Nibras instance.

---

## 1. Infrastructure Overview

```
Internet → Nginx (80/443) → API (4848) → PostgreSQL 16
                          → Web (3000)  → Redis 7 (BullMQ queue — future)
                                          ↑
                                        Worker
```

All internal services communicate over a Docker bridge network (`internal`). Only Nginx is exposed to the internet.

---

## 2. Prerequisites

- Docker ≥ 24 and Docker Compose v2
- A domain name pointing to your server IP
- TLS certificates (use Certbot/Let's Encrypt):
  ```bash
  certbot certonly --standalone -d nibras.yourschool.edu
  cp /etc/letsencrypt/live/nibras.yourschool.edu/fullchain.pem nginx/certs/
  cp /etc/letsencrypt/live/nibras.yourschool.edu/privkey.pem  nginx/certs/
  ```
- A GitHub App (see [GitHub App Setup](#github-app-setup))

---

## 3. First Deployment

```bash
# 1. Clone the repo
git clone https://github.com/your-org/nibras.git
cd nibras

# 2. Create production env file
cp .env.example .env.prod
# Edit .env.prod — fill in all required values

# 3. Generate an encryption key
openssl rand -hex 32  # paste into NIBRAS_ENCRYPTION_KEY

# 4. Build and start
docker compose -f docker-compose.prod.yml up -d --build

# 5. Verify
curl https://nibras.yourschool.edu/healthz   # {"ok":true}
curl https://nibras.yourschool.edu/readyz    # {"ok":true}
```

---

## 4. Environment Variables (`.env.prod`)

| Variable                   | Required | Description                                                            |
| -------------------------- | -------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`             | ✅       | PostgreSQL connection string                                           |
| `NIBRAS_ENCRYPTION_KEY`    | ✅       | 32-byte hex key for token encryption. Generate: `openssl rand -hex 32` |
| `GITHUB_APP_ID`            | ✅       | GitHub App numeric ID                                                  |
| `GITHUB_APP_CLIENT_ID`     | ✅       | GitHub App OAuth client ID                                             |
| `GITHUB_APP_CLIENT_SECRET` | ✅       | GitHub App OAuth client secret                                         |
| `GITHUB_APP_PRIVATE_KEY`   | ✅       | PEM key (newlines as `\n`)                                             |
| `GITHUB_WEBHOOK_SECRET`    | ✅       | Random secret configured in GitHub App                                 |
| `GITHUB_TEMPLATE_OWNER`    | ✅       | Org/user owning starter repos                                          |
| `GITHUB_TEMPLATE_REPO`     | optional | Default template repo name                                             |
| `NIBRAS_API_BASE_URL`      | ✅       | Public API URL e.g. `https://nibras.yourschool.edu`                    |
| `NIBRAS_WEB_BASE_URL`      | ✅       | Public web URL (same as above typically)                               |
| `RESEND_API_KEY`           | optional | Resend.com key for email notifications                                 |
| `NIBRAS_EMAIL_FROM`        | optional | From address e.g. `Nibras <noreply@yourschool.edu>`                    |
| `SENTRY_DSN`               | optional | Sentry project DSN for error monitoring                                |
| `NIBRAS_METRICS_TOKEN`     | optional | Bearer token to protect `/metrics`                                     |
| `NIBRAS_AI_API_KEY`        | optional | OpenAI-compatible key for AI grading                                   |
| `NIBRAS_AI_MODEL`          | optional | Model name (default: `gpt-4o-mini`)                                    |
| `RATE_LIMIT_MAX`           | optional | Requests per minute per user (default: 100)                            |
| `BODY_LIMIT_BYTES`         | optional | Max request body size (default: 524288 = 512 KB)                       |

---

## 5. GitHub App Setup

1. Go to **GitHub → Settings → Developer Settings → GitHub Apps → New GitHub App**
2. Set:
   - **Homepage URL**: your Nibras URL
   - **Callback URL**: `https://nibras.yourschool.edu/v1/github/oauth/callback`
   - **Webhook URL**: `https://nibras.yourschool.edu/v1/github/webhooks`
   - **Webhook secret**: random string (→ `GITHUB_WEBHOOK_SECRET`)
   - **Permissions**:
     - Repository: Contents (Read & Write), Metadata (Read)
     - Organisation: Members (Read)
3. Generate a private key and download the PEM file.
4. Set environment variables from the App's settings page.

---

## 6. Database Backups

Backups run automatically via the `backup` container (daily at 02:00 UTC, keeps 30 copies in `./backups/`).

Manual backup:

```bash
./scripts/backup.sh ./backups
```

Restore:

```bash
gunzip -c backups/nibras-db-20260401T020000Z.sql.gz \
  | psql "$DATABASE_URL"
```

---

## 7. Monitoring

### Health Endpoints

| Endpoint       | Purpose                                                         |
| -------------- | --------------------------------------------------------------- |
| `GET /healthz` | Liveness — always returns `{"ok":true}`                         |
| `GET /readyz`  | Readiness — checks DB connectivity                              |
| `GET /metrics` | Prometheus-format metrics (protected by `NIBRAS_METRICS_TOKEN`) |

### Prometheus Scrape Config

```yaml
scrape_configs:
  - job_name: nibras-api
    static_configs:
      - targets: ['nibras.yourschool.edu']
    metrics_path: /metrics
    bearer_token: <NIBRAS_METRICS_TOKEN>
    scheme: https
```

### Grafana Dashboard

Import `grafana/nibras-dashboard.json` into your Grafana instance. Set the Prometheus datasource to the one scraping `/metrics`.

Key panels:

- Request rate by method/status
- Total 2xx / 4xx+5xx / 429 counters
- Verification queue depth (gauge)
- Verification outcomes over time (passed / failed / needs_review)

---

## 8. Scaling

The API and worker are stateless (all state in PostgreSQL). To scale horizontally:

1. Point multiple API container replicas at the same database.
2. Add Nginx upstream entries:
   ```nginx
   upstream api_upstream {
     server api1:4848;
     server api2:4848;
     keepalive 64;
   }
   ```
3. Run only **one** worker instance per database (or use BullMQ Redis-backed queue for multi-worker support — see Phase 2 roadmap).

---

## 9. Upgrades

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Prisma migrations run automatically on API startup (`prisma migrate deploy`).

---

## 10. Graceful Shutdown

Both the API and worker handle `SIGTERM` / `SIGINT`:

- In-flight requests complete before the process exits.
- Docker Compose sends `SIGTERM` by default on `docker compose stop` or `docker compose down`.

Allow up to 30 seconds (the default `requestTimeout`) for in-flight requests to drain.

---

## 11. Log Aggregation

All services log JSON to stdout. Use your preferred log shipper:

```yaml
# docker-compose.prod.yml snippet — add to any service
logging:
  driver: 'json-file'
  options:
    max-size: '50m'
    max-file: '5'
```

Or forward to Loki:

```yaml
logging:
  driver: loki
  options:
    loki-url: 'http://loki:3100/loki/api/v1/push'
    loki-external-labels: 'service={{.Name}}'
```

---

## 12. SSL Certificate Renewal

```bash
# Renew (run as cron or systemd timer)
certbot renew --quiet
cp /etc/letsencrypt/live/nibras.yourschool.edu/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/nibras.yourschool.edu/privkey.pem  nginx/certs/
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```
