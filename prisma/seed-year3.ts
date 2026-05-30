/**
 * CLI entry: npm run seed:year3
 */
import { PrismaClient } from '@prisma/client';
import { seedYear3Curriculum } from '../apps/api/src/lib/year3-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Year 3 university curriculum...\n');
  await seedYear3Curriculum(prisma, { log: console.log });
  console.log('\n🎉 Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
