/**
 * CLI entry: npm run seed:year1
 */
import { PrismaClient } from '@prisma/client';
import { seedYear1Curriculum } from '../apps/api/src/lib/year1-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Year 1 university curriculum...\n');
  await seedYear1Curriculum(prisma, { log: console.log });
  console.log('\n🎉 Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
