# Year 2 Shared CS Core

Eight tracking courses (21 planner units in the shared core, plus CS 109 and CS 143 as standard sophomore electives). See [year1-curriculum.md](./year1-curriculum.md) for freshman courses.

## Planner ↔ tracking mapping

| Planner code | Units | Tracking slug | Learn display |
|--------------|-------|---------------|---------------|
| CS201 | 4 | `stanford-cs107` | CS 107 — Computer Organization & Systems |
| CS202 | 4 | `stanford-cs161` | CS 161 — Design & Analysis of Algorithms |
| CS203 | 3 | `year2-cs203` | CS 203 — Databases |
| CS204 | 4 | `stanford-cs110` | CS 110 — Principles of Computer Systems |
| CS205 | 3 | `year2-cs205` | CS 205 — Software Engineering Studio |
| CS206 | 3 | `year2-cs206` | CS 206 — Networks and Security |
| — | — | `stanford-cs109` | CS 109 — Probability for Computer Scientists |
| — | — | `stanford-cs143` | CS 143 — Compilers |

## Suggested schedule

- **Fall:** CS 107, CS 109, CS 161, CS 203
- **Spring:** CS 110, CS 205, CS 206, CS 143

Students select a specialization track starting Year 2 (`trackSelectionMinYear: 2` in the program seed).

## Seed commands

```bash
npm run db:generate
npm run seed:year2
```

Optional CLI projects for CS 107 (after course seed):

```bash
npm run seed:stanford-projects
```

The API upserts Year 2 courses on startup and on first `prisma-store` bootstrap (with Year 1).

Production manual seed:

```bash
DATABASE_URL='postgresql://...' npm run seed:year2
```

## Verification

1. Set student `yearLevel` to **2** (or advance after Year 1).
2. Confirm eight courses appear whose `termLabel` starts with `Year 2`.
3. Planner: place CS201–CS206 in Year 2 Fall/Spring; confirm **Shared CS Core** shows 21 units.
4. Per course: sections, assignments, project milestones.

## Source files

- Definitions: [apps/api/src/lib/year2-curriculum.ts](../apps/api/src/lib/year2-curriculum.ts)
- Seeder: [apps/api/src/lib/year2-seed.ts](../apps/api/src/lib/year2-seed.ts)
- CLI: [prisma/seed-year2.ts](../prisma/seed-year2.ts)
