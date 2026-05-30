/**
 * CLI entry: npm run seed:year4
 */
import { PrismaClient } from '@prisma/client';
import { seedYear4Curriculum } from '../apps/api/src/lib/year4-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Year 4 university curriculum...\n');
  await seedYear4Curriculum(prisma, { log: console.log });
  console.log('\n🎉 Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
