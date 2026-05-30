/**
 * CLI entry: npm run seed:year2
 */
import { PrismaClient } from '@prisma/client';
import { seedYear2Curriculum } from '../apps/api/src/lib/year2-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Year 2 university curriculum...\n');
  await seedYear2Curriculum(prisma, { log: console.log });
  console.log('\n🎉 Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
