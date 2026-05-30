# Year 1 Foundation Curriculum

Seven tracking courses (22 planner units) for the freshman year. Planner catalog codes differ from Learn catalog display names by design.

## Planner ↔ tracking mapping

| Planner code | Units | Tracking slug | Learn display |
|--------------|-------|---------------|---------------|
| CS101 | 4 | `stanford-cs106a` | CS 106A — Programming Methodology |
| MATH111 | 3 | `year1-math111` | MATH 111 — Calculus I |
| ENG101 | 2 | `year1-eng101` | ENG 101 — Academic Writing |
| CS102 | 4 | `stanford-cs106b` | CS 106B — Programming Abstractions |
| CS103 | 3 | `stanford-cs103` | CS 103 — Mathematical Foundations of Computing |
| MATH112 | 3 | `year1-math112` | MATH 112 — Calculus II |
| PHY101 | 3 | `year1-phy101` | PHY 101 — Physics for Computing |

**CS 107** and other Year 2 courses live in [year2-curriculum.md](./year2-curriculum.md) (not part of the seven foundation courses).

**CS106L** (`cs106l`, Self-Paced) is optional C++ practice linked from the CS 106B project resources.

## Suggested schedule

- **Fall:** CS 106A, MATH 111, ENG 101
- **Spring:** CS 106B, CS 103, MATH 112, PHY 101

## Seed commands

```bash
npm run db:generate
npm run seed:year1
```

Optional CLI projects for CS 106B (after course seed):

```bash
npm run seed:stanford-projects
```

The API also upserts Year 1 courses on **API startup** (after deploy) and on first `prisma-store` bootstrap. Year 2 uses the same pattern — see [year2-curriculum.md](./year2-curriculum.md).

### Production (nibrasplatform.me)

After deploy, the API container runs `seedYear1Curriculum` on startup (see `apps/api/src/server.ts`). No manual step is required for the seven Year 1 courses.

Optional manual seed (e.g. re-run after editing curriculum without redeploying):

```bash
DATABASE_URL='postgresql://...' npm run seed:year1
DATABASE_URL='postgresql://...' npm run seed:stanford-projects
```

Use the Supabase `DATABASE_URL` from Azure Container Apps secret `database-url` if you need to seed from your laptop.

Full Stanford Years 2–4 (includes Year 1 via shared module):

```bash
node scripts/seed-stanford-v2.js
```

## Verification

1. Sign in as a student with `yearLevel: 1`.
2. Confirm seven courses appear (auto-enrolled when `termLabel` starts with `Year 1`).
3. Open **Planner** — place CS101–PHY101 in Year 1 Fall/Spring; confirm **Year 1 Foundation** shows 22 units.
4. Per course: sections, assignments, project milestones; CS courses also have lecture videos.
5. Submit a text assignment and a milestone submission to confirm the review queue.

## Source files

- Definitions: [apps/api/src/lib/year1-curriculum.ts](../apps/api/src/lib/year1-curriculum.ts)
- Seeder: [apps/api/src/lib/year1-seed.ts](../apps/api/src/lib/year1-seed.ts)
- CLI: [prisma/seed-year1.ts](../prisma/seed-year1.ts)
