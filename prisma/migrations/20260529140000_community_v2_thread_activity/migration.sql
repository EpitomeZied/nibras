-- AlterTable
ALTER TABLE "CommunityThread" ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill from updatedAt for existing rows
UPDATE "CommunityThread" SET "lastActivityAt" = "updatedAt" WHERE "lastActivityAt" IS NOT NULL;
