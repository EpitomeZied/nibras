# Open Curricula Seeds

Optional database seeds for public, self-paced courses built from open educational resources. These are **not** run by default with `prisma db seed`.

## MIT Missing Semester

The first seeded course mirrors [MIT Missing Semester](https://missing.csail.mit.edu/) (2026 IAP syllabus):

- **Slug:** `missing-semester`
- **Catalog:** public (`isPublic: true`) — appears under **Learn → Catalog → Courses**
- **Content:** 9 lecture sections with YouTube videos, graded assignments, and manual-review projects
- **License:** Official lecture materials are CC BY-NC-SA; Nibras prompts are adapted exercises with attribution in each assignment

## Commands

After your database is running and migrations are applied:

```bash
npm run db:generate
npm run seed:open-curricula
npm run seed:open-curricula-projects
```

Run **projects** only after the course seed (projects reference the `missing-semester` course row).

### Production (nibrasplatform.me)

The course is **not** in your local DB on production until the data exists there. Two options:

1. **Deploy** the API build that includes runtime open-curricula seed (`apps/api/src/lib/open-curricula-seed.ts`). On first catalog/API request after deploy, the course is upserted into the production database automatically.
2. **Manual seed** against production Postgres (Supabase `DATABASE_URL` from Azure secrets):

   ```bash
   DATABASE_URL='postgresql://...' npm run seed:open-curricula
   DATABASE_URL='postgresql://...' NIBRAS_API_BASE_URL='https://<your-api-host>' npm run seed:open-curricula-projects
   ```

On [nibrasplatform.me/catalog](https://nibrasplatform.me/catalog), use the **Public** filter or search for `Missing` / `MISSING`.

## Verification

1. Sign in to the web app.
2. Open **Catalog → Courses** and join **The Missing Semester of Your CS Education**.
3. Open the course hub — confirm 9 lectures, 9 assignments, and 9 published projects.
4. Submit a sample assignment and a project milestone (text or link) to confirm the review queue receives entries.

## Adding more courses

Extend the `OPEN_COURSES` array in `prisma/seed-open-curricula.ts` and add matching entries to `PROJECTS` in `prisma/seed-open-curricula-projects.ts`, following the same pattern as Stanford seeds.
