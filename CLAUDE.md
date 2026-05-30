# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm ci

# Build all packages (in dependency order)
npm run build

# Run tests (builds first, then node --test)
npm run test

# Run a single test file
node --test test/<file>.js

# Lint all workspaces
npm run lint

# Auto-fix lint and formatting issues
npm run lint:fix

# Full local dev stack (watch + API + web + worker)
npm run dev

# AI tutor (optional; requires OPENAI_API_KEY or NIBRAS_AI_API_KEY in .env)
npm run tutor:dev

# Database
npm run db:generate      # Regenerate Prisma client after schema changes
npm run db:push          # Push schema without migration (dev only)
npm run db:migrate       # Create a named migration
npm run db:deploy        # Apply migrations (production path)
npm run db:local:reset   # Tear down and recreate local Docker DB (destructive)

# Optional curriculum seeds (not run by default prisma db seed)
npm run seed:stanford
npm run seed:stanford-projects
npm run seed:open-curricula          # MIT Missing Semester + similar public courses
npm run seed:open-curricula-projects
npm run seed:year1
npm run seed:year2
```

## Architecture

Nibras is an npm **monorepo** (`apps/*`, `packages/*`) with a legacy CommonJS CLI (`src/`) for backwards compatibility. `bin/nibras.js` tries `apps/cli/dist/index.js` first; falls back to `src/cli.js` if the modern build is absent.

### Packages (dependency order for builds)

| Package              | Role                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| `packages/contracts` | Zod schemas and inferred TypeScript types shared by all layers            |
| `packages/core`      | CLI utilities: API client (with token refresh), config, manifest, git ops |
| `packages/github`    | JWT signing and webhook HMAC validation for GitHub App                    |
| `packages/grading`   | AI semantic grading runner (OpenAI-compatible, optional)                  |

### Apps

| App           | Role                                                                         |
| ------------- | ---------------------------------------------------------------------------- |
| `apps/cli`    | Published `@nibras/cli` npm package; TypeScript; Commander.js                |
| `apps/api`    | Fastify REST API (auth, GitHub OAuth/webhooks, submissions, tracking, admin) |
| `apps/web`    | Next.js 15 / React 19 instructor dashboard                                   |
| `apps/worker` | Async processor for verification and grading jobs                            |
| `apps/proxy`  | Local HTTP proxy for ngrok: `/v1/*` → API, else → web                        |
| `apps/tutor`  | Flask AI tutor (Hassona); proxied via API when `CHATBOT_V1_URL` is set       |

### Key data flows

- **Device login:** CLI → API device-flow → GitHub OAuth → access/refresh tokens stored in `~/.nibras/cli.json`
- **Submission:** CLI stages allowed files, commits, pushes → polls API until verification completes
- **Grading:** Worker picks up jobs, calls `@nibras/grading`, writes results back; AI is disabled if `NIBRAS_AI_API_KEY` is unset
- **Tracking:** `apps/api/src/features/tracking/` manages courses, projects, milestones, student progress

### Configuration files (runtime, not build)

- `~/.nibras/cli.json` — per-user CLI tokens and API base URL
- `.nibras/project.json` — per-project manifest (test mode, submission paths, grading config, Node.js buildpack version)
- `.nibras/task.md` — task instructions shown via `nibras task`
- `.nibras.json` — **legacy** grading configuration for the `src/` CLI (CS161 course). Maps subject → project → `{ type, path, totalPoints, scoresFile }`. Not used by the modern `apps/cli` stack.

### Database

PostgreSQL via Prisma. Schema lives in `prisma/schema.prisma`. Local dev uses Docker Compose (`docker-compose.yml`). Always run `npm run db:generate` after editing the schema.

### TypeScript setup

All packages extend `tsconfig.base.json` (ES2022 target, strict mode, CommonJS output). Each workspace compiles independently; `npm run build` runs them in dependency order.

### Linting & Formatting

ESLint v9 flat config lives at `eslint.config.mjs` (root). Prettier is run as an ESLint plugin so both checks happen in one pass (`npm run lint`). Rules:

- TypeScript rules via `typescript-eslint` for all `apps/` and `packages/`
- React + react-hooks rules scoped to `apps/web/**`
- CommonJS relaxations for `src/`, `bin/`, `scripts/`, and `test/`

### Environment

Copy `.env.example` to `.env`. Required groups: database (`DATABASE_URL`), GitHub App credentials, session secret. Optional groups are clearly marked in `.env.example`.

### Optional integrations

#### Sentry (error monitoring)

Used in `apps/api` (`src/server.ts`, `src/app.ts`) and `apps/worker` (`src/worker.ts`) via `@sentry/node`. Initialised at process start and **gracefully skipped** if `SENTRY_DSN` is absent — no errors will surface.

#### Resend (email notifications)

Used in `apps/worker/src/email.ts` and `apps/api/src/lib/email.ts`. Sends submission-status and review-ready emails. **Silently disabled** when `RESEND_API_KEY` is unset — no breaking change.

### CI

`.github/workflows/ci.yml` spins up Postgres 16, runs `npm ci`, `db:generate`, `db:deploy`, **`lint`**, `build`, tests, and `web:build`. PRs must pass all steps.

`.github/workflows/release.yml` triggers on Git tags matching `v*`. It builds all packages, publishes `@nibras/cli` to npm (public access), and creates a GitHub Release with auto-generated release notes. Requires the `NPM_TOKEN` secret to be set in repo settings.
