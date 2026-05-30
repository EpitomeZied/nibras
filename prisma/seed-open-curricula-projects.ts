/**
 * CLI entry: npm run seed:open-curricula-projects
 */
import { PrismaClient } from '@prisma/client';
import { seedOpenCurriculaProjects } from '../apps/api/src/lib/open-curricula-projects-seed';

const prisma = new PrismaClient();
const API_BASE = process.env.NIBRAS_API_BASE_URL ?? 'https://nibras-api.fly.dev';

async function main() {
  console.log('🚀 Seeding open curricula projects...\n');
  const total = await seedOpenCurriculaProjects(prisma, API_BASE, { log: console.log });
  console.log(`\n🎉 Done! ${total} projects seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
