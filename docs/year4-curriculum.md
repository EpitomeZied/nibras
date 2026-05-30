# Year 4 Senior

Four tracking courses: deep learning, NLP, computer vision, and the senior capstone. See [year3-curriculum.md](./year3-curriculum.md) for junior courses.

## Planner ↔ tracking mapping

| Planner code | Units | Tracking slug | Learn display |
|--------------|-------|---------------|---------------|
| CS311 | 3 | `stanford-cs230` | CS 230 — Deep Learning |
| CS312 | 3 | `stanford-cs224n` | CS 224N — NLP with Deep Learning |
| CS313 | 3 | `stanford-cs231n` | CS 231N — Deep Learning for Computer Vision |
| CS303 | 3 | `stanford-cs-capstone` | CS 303 — Senior Capstone Project |

## Suggested schedule

- **Fall:** CS 230, CS 224N
- **Spring:** CS 231N, CS 303 (capstone delivery)

Students complete CS 302 (capstone planning) in Year 3 Spring before CS 303.

## Seed commands

```bash
npm run db:generate
npm run seed:year4
```

The API upserts Year 4 courses on startup and on first `prisma-store` bootstrap (with Years 1–3).

Production manual seed:

```bash
DATABASE_URL='postgresql://...' npm run seed:year4
```

Optional CLI projects:

```bash
npm run seed:stanford-projects
```

Covers `cs224n` and `cs231n` among other slugs.

## Verification

1. Set student `yearLevel` to **4**.
2. Confirm four courses appear whose `termLabel` starts with `Year 4`.
3. Per course: sections, assignments, project milestones.

## Source files

- Definitions: [apps/api/src/lib/year4-curriculum.ts](../apps/api/src/lib/year4-curriculum.ts)
- Seeder: [apps/api/src/lib/year4-seed.ts](../apps/api/src/lib/year4-seed.ts)
- CLI: [prisma/seed-year4.ts](../prisma/seed-year4.ts)
