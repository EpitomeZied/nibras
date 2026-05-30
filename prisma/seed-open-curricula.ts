/**
 * CLI entry: npm run seed:open-curricula
 */
import { PrismaClient } from '@prisma/client';
import { seedOpenCurricula } from '../apps/api/src/lib/open-curricula-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding open curricula...\n');
  await seedOpenCurricula(prisma, { log: console.log });
  console.log('\n🎉 Open curricula seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
