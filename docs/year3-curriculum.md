# Year 3 Junior

Six tracking courses covering AI/ML depth, data mining, cryptography, research methods, and capstone planning. See [year2-curriculum.md](./year2-curriculum.md) for sophomore courses.

## Planner ↔ tracking mapping

| Planner code | Units | Tracking slug | Learn display |
|--------------|-------|---------------|---------------|
| CS311 | 3 | `stanford-cs221` | CS 221 — Artificial Intelligence |
| CS311 | 3 | `stanford-cs229` | CS 229 — Machine Learning |
| CS301 | 3 | `year3-cs301` | CS 301 — Research Methods in Computing |
| CS321 | 3 | `stanford-cs246` | CS 246 — Mining Massive Datasets |
| CS333 | 3 | `stanford-cs255` | CS 255 — Introduction to Cryptography |
| CS302 | 3 | `year3-cs302` | CS 302 — Capstone Planning |

## Suggested schedule

- **Fall:** CS 221, CS 229, CS 301
- **Spring:** CS 246, CS 255, CS 302

## Seed commands

```bash
npm run db:generate
npm run seed:year3
```

The API upserts Year 3 courses on startup and on first `prisma-store` bootstrap (with Years 1–2).

Production manual seed:

```bash
DATABASE_URL='postgresql://...' npm run seed:year3
```

Optional CLI projects (after course seed):

```bash
npm run seed:stanford-projects
```

Covers `cs221` among other slugs via `COURSE_SLUG_LOOKUP`.

## Verification

1. Set student `yearLevel` to **3**.
2. Confirm six courses appear whose `termLabel` starts with `Year 3`.
3. Per course: sections, assignments, project milestones.

## Source files

- Definitions: [apps/api/src/lib/year3-curriculum.ts](../apps/api/src/lib/year3-curriculum.ts)
- Seeder: [apps/api/src/lib/year3-seed.ts](../apps/api/src/lib/year3-seed.ts)
- CLI: [prisma/seed-year3.ts](../prisma/seed-year3.ts)
