# V2 release stack — 15 PRs

Ordered merge sequence for the Nibras Platform V2 rollout. All items below were merged to `main` by 2026-05-29.

## Merge order

| Stack # | GitHub PR | Branch | V2 scope | Status |
| ------- | --------- | ------ | -------- | ------ |
| 0 | [#16](https://github.com/EpitomeZied/nibras/pull/16) | `v2/pr0-ci-lint` | CI lint unblock on `main` | Merged |
| 1 | [#1](https://github.com/EpitomeZied/nibras/pull/1) | `v2/pr1-landing-footer` | Landing nav + footer contact | Merged |
| 5 | [#5](https://github.com/EpitomeZied/nibras/pull/5) | `v2/pr5-global-base-url` | `WEB_BASE_URL` / `NEXT_PUBLIC_NIBRAS_WEB_BASE_URL` | Merged |
| 3 | [#3](https://github.com/EpitomeZied/nibras/pull/3) | `v2/pr4-remove-vjudge` | Remove VJudge | Merged |
| 4 | [#4](https://github.com/EpitomeZied/nibras/pull/4) | `v2/pr3-competitions-calendar` | Contest duration + week/day calendar | Merged |
| 2 | [#2](https://github.com/EpitomeZied/nibras/pull/2) | `v2/pr2-public-community` | Public read-only discussions | Merged |
| 11 | [#11](https://github.com/EpitomeZied/nibras/pull/11) | `v2/pr11-catalog-lms-ui` | Catalog LMS UI (lectures, assignments, MCQ, quiz, MP4) | Merged |
| 6–8 | [#6](https://github.com/EpitomeZied/nibras/pull/6)–[#8](https://github.com/EpitomeZied/nibras/pull/8) | MCQ / video / quiz branches | Superseded by #11 | Closed |
| 9 | [#9](https://github.com/EpitomeZied/nibras/pull/9) | `v2/pr9-google-auth` | Google OAuth (Better Auth) | Merged |
| 10 | [#10](https://github.com/EpitomeZied/nibras/pull/10) | `v2/pr10-cli-v2` | CLI 2.0 | Merged |
| 12 | [#12](https://github.com/EpitomeZied/nibras/pull/12) | `feat/community-v2-mvp` | Community v2 MVP (votes, reputation hooks) | Merged |
| 13 | [#13](https://github.com/EpitomeZied/nibras/pull/13) | `feat/community-v2-complete` | Moderation, bookmarks, tutor publish | Merged |
| 14 | [#14](https://github.com/EpitomeZied/nibras/pull/14) | `feat/gamification-v2` | Badges, rating titles, reputation levels | Merged |
| 15 | [#15](https://github.com/EpitomeZied/nibras/pull/15) | `feat/user-profile` | Scoped user profile page | Merged |

## Post-merge checklist

- [x] All stack PRs merged to `main`
- [x] Azure deploy workflow succeeded ([`deploy-azure.yml`](../.github/workflows/deploy-azure.yml))
- [x] Production migrations: applied by worker container on startup (`prisma migrate deploy`)
- [ ] GitHub vars: `NIBRAS_WEB_BASE_URL=https://nibrasplatform.me`, API URLs set
- [x] OAuth: GitHub (Better Auth + GitHub App callbacks on API host)
- [x] Smoke: landing, `/community/discussions`, `/competitions`, API `/readyz` (2026-05-29)

## Production migrations (V2)

Applied via Prisma on deploy:

- `20260529120000_assignment_types_mcq_quiz` — LMS assignment types (#11)
- `20260529140000_community_v2_thread_activity` — Community MVP (#12)
- `20260529150000_community_v2_moderation_bookmarks` — Community complete (#13)
- `20260529160000_badge_category_rating` — Gamification (#14)
- `20260529180000_user_bio` — User profile (#15)

## Azure deploy

GitHub repository variables (already configured for production):

| Variable | Production value |
| -------- | ---------------- |
| `NIBRAS_WEB_BASE_URL` | `https://nibrasplatform.me` |
| `NIBRAS_API_BASE_URL` | Azure API FQDN or `https://api.nibrasplatform.me` |
| `AZURE_RESOURCE_GROUP` | `nibras-rg` |
| `AZURE_DEPLOY_AUTH` | `oidc` |

Push to `main` triggers deploy automatically when `apps/**`, `packages/**`, or `prisma/**` change. Manual run: **Actions → Deploy to Azure Container Apps → Run workflow**.
