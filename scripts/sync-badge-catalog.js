#!/usr/bin/env node
/**
 * Upsert all badge definitions from BADGE_CATALOG into Postgres.
 * Usage (production): DATABASE_URL="..." node -r dotenv/config scripts/sync-badge-catalog.js
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const {
  BADGE_CATALOG,
  badgeSeedToDefinition,
} = require('../apps/api/dist/features/gamification/badges-catalog');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(
      BADGE_CATALOG.map((badge) => {
        const data = badgeSeedToDefinition(badge);
        return prisma.badgeDefinition.upsert({
          where: { code: badge.code },
          create: data,
          update: data,
        });
      })
    );
    const count = await prisma.badgeDefinition.count();
    console.log(`Badge catalog synced: ${count} rows (expected ${BADGE_CATALOG.length})`);
    if (count < BADGE_CATALOG.length) {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
