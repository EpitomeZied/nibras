# Nibras — Production Deployment Guide

This guide covers deploying Nibras on Railway or Fly.io. The stack consists of four services: **api**, **web**, **worker**, and **PostgreSQL**.

---

## Required Environment Variables

### All services

| Variable                | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `DATABASE_URL`          | PostgreSQL connection string                           |
| `NIBRAS_ENCRYPTION_KEY` | 32-byte hex key — generate with `openssl rand -hex 32` |

### API service

| Variable                   | Description                                                                |
| -------------------------- | -------------------------------------------------------------------------- |
| `PORT`                     | Port to listen on (Railway sets this automatically)                        |
| `NIBRAS_API_BASE_URL`      | Public URL of the API (e.g. `https://api.nibras.app`)                      |
| `NIBRAS_WEB_BASE_URL`      | Public URL of the web dashboard                                            |
| `GITHUB_APP_ID`            | GitHub App numeric ID                                                      |
| `GITHUB_APP_CLIENT_ID`     | GitHub App OAuth client ID                                                 |
| `GITHUB_APP_CLIENT_SECRET` | GitHub App OAuth client secret                                             |
| `GITHUB_APP_PRIVATE_KEY`   | PEM private key for JWT signing (newlines as `\n`)                         |
| `GITHUB_APP_NAME`          | Slug of your GitHub App                                                    |
| `GITHUB_WEBHOOK_SECRET`    | Secret configured in GitHub App webhook settings                           |
| `GITHUB_TEMPLATE_OWNER`    | GitHub org/user that owns template repos                                   |
| `GITHUB_TEMPLATE_REPO`     | Template repository name                                                   |
| `RESEND_API_KEY`           | (Optional) Resend API key for email notifications                          |
| `NIBRAS_EMAIL_FROM`        | (Optional) Verified sender address, e.g. `Nibras <noreply@yourdomain.com>` |
| `SENTRY_DSN`               | (Optional) Sentry DSN for error tracking                                   |
| `RATE_LIMIT_MAX`           | (Optional) Global rate limit per minute, default `100`                     |

### Web service (Next.js)

| Variable                          | Description                                                         |
| --------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`                    | Same Postgres URL as API (Better Auth + session bridge)             |
| `BETTER_AUTH_SECRET`              | Required in production (`openssl rand -base64 32`)                  |
| `BETTER_AUTH_URL`                 | Public web origin, e.g. `https://nibrasplatform.me`                 |
| `GITHUB_APP_CLIENT_ID`            | GitHub OAuth (same as API GitHub App)                               |
| `GITHUB_APP_CLIENT_SECRET`        | GitHub OAuth secret                                                 |
| `RESEND_API_KEY`                  | Magic-link and welcome emails (optional; skipped if unset)          |
| `NIBRAS_EMAIL_FROM`               | Verified Resend sender                                              |
| `NIBRAS_ENCRYPTION_KEY`           | Encrypt GitHub tokens written by session bridge (same as API)       |
| `NEXT_PUBLIC_NIBRAS_API_BASE_URL` | Public API URL (exposed to browser)                                 |
| `NEXT_PUBLIC_NIBRAS_WEB_BASE_URL` | Public web URL (exposed to browser)                                 |
| `POLAR_ACCESS_TOKEN`              | (Optional) Enables Polar plugin scaffold                            |
| `POLAR_WEBHOOK_SECRET`            | (Optional) Polar webhook verification                               |
| `POLAR_SERVER`                    | `sandbox` or `production`                                           |
| `POLAR_PRODUCT_PRO_ID`            | (Optional) Polar product UUID when enabling checkout                |
| `NEXT_PUBLIC_POLAR_ENABLED`       | Set `true` when Polar checkout is configured                        |

### Worker service

Same as API — needs `DATABASE_URL`, `NIBRAS_ENCRYPTION_KEY`, and AI variables if grading is enabled.

| Variable             | Description                                 |
| -------------------- | ------------------------------------------- |
| `NIBRAS_AI_API_KEY`  | (Optional) OpenAI-compatible API key        |
| `NIBRAS_AI_MODEL`    | (Optional) Model name, e.g. `gpt-4o-mini`   |
| `NIBRAS_AI_BASE_URL` | (Optional) API base URL, defaults to OpenAI |

---

## Railway Deployment

### 1. Create a new Railway project

```bash
railway login
railway new
```

### 2. Add a PostgreSQL database

In the Railway dashboard: **New Service → Database → PostgreSQL**. Railway sets `DATABASE_URL` automatically for services in the same project.

### 3. Deploy each service from the monorepo

Railway detects Dockerfiles automatically. Set the **Root Directory** per service in Railway settings:

| Service | Root Directory | Dockerfile               |
| ------- | -------------- | ------------------------ |
| api     | `apps/api`     | `apps/api/Dockerfile`    |
| web     | `apps/web`     | `apps/web/Dockerfile`    |
| worker  | `apps/worker`  | `apps/worker/Dockerfile` |

### 4. Run database migrations (first deploy)

```bash
railway run --service api npx prisma migrate deploy
```

Or set the API service **Start Command** to run migrations before starting:

```
npx prisma migrate deploy && node dist/server.js
```

### 5. Configure environment variables

In each service's **Variables** tab, add the variables from the table above.

---

## Fly.io Deployment

### 1. Install flyctl and log in

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### 2. Launch each app

```bash
# API
cd apps/api && fly launch --name nibras-api --no-deploy
fly secrets set DATABASE_URL="..." NIBRAS_ENCRYPTION_KEY="..." ...
fly deploy

# Web
cd apps/web && fly launch --name nibras-web --no-deploy
fly secrets set NEXT_PUBLIC_NIBRAS_API_BASE_URL="https://nibras-api.fly.dev" ...
fly deploy

# Worker
cd apps/worker && fly launch --name nibras-worker --no-deploy
fly secrets set DATABASE_URL="..." ...
fly deploy
```

### 3. Provision a Postgres cluster

```bash
fly postgres create --name nibras-db
fly postgres attach nibras-db --app nibras-api
fly postgres attach nibras-db --app nibras-worker
```

### 4. Run migrations

```bash
fly ssh console --app nibras-api -C "npx prisma migrate deploy"
```

---

## Docker (self-hosted)

### Build images

```bash
# From repo root
docker build -f apps/api/Dockerfile -t nibras-api .
docker build -f apps/web/Dockerfile -t nibras-web .
docker build -f apps/worker/Dockerfile -t nibras-worker .
```

### Start all services

```bash
docker compose up -d
```

The default `docker-compose.yml` starts PostgreSQL, the API, the web dashboard, and the worker.

### Run migrations on first start

```bash
docker compose exec api npx prisma migrate deploy
```

---

## GitHub App Webhook URL

After deploying the API, register the webhook in your GitHub App settings:

1. Go to **GitHub → Settings → Developer settings → GitHub Apps → your app**
2. Set **Webhook URL** to: `https://<your-api-domain>/v1/github/webhooks`
3. Set **Webhook Secret** to the value of `GITHUB_WEBHOOK_SECRET`
4. Subscribe to events: **Push**, **Installation**, **Pull request**

---

## Post-deploy checklist

- [ ] `GET https://<api>/healthz` returns `{"ok":true}`
- [ ] `GET https://<api>/readyz` returns `{"ok":true}` (confirms DB connection)
- [ ] GitHub OAuth flow completes at `https://<web>/auth/signin`
- [ ] Worker processes queued jobs (check `GET /metrics` for queue depth)
