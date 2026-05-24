-- CreateEnum
CREATE TYPE "BadgeRarity" AS ENUM ('common', 'rare', 'epic', 'legendary');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('onboarding', 'projects', 'community', 'practice', 'competitions', 'meta');

-- CreateEnum
CREATE TYPE "ReputationCategory" AS ENUM ('course', 'community', 'problem', 'contest', 'badge');

-- CreateTable
CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "iconUrl" TEXT,
    "rarity" "BadgeRarity" NOT NULL DEFAULT 'common',
    "category" "BadgeCategory" NOT NULL DEFAULT 'onboarding',
    "threshold" INTEGER NOT NULL DEFAULT 1,
    "points" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" "ReputationCategory" NOT NULL DEFAULT 'course',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BadgeDefinition_code_key" ON "BadgeDefinition"("code");

-- CreateIndex
CREATE INDEX "BadgeDefinition_category_sortOrder_idx" ON "BadgeDefinition"("category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "UserBadge_userId_earnedAt_idx" ON "UserBadge"("userId", "earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReputationEvent_userId_source_key" ON "ReputationEvent"("userId", "source");

-- CreateIndex
CREATE INDEX "ReputationEvent_userId_createdAt_idx" ON "ReputationEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReputationEvent_userId_category_idx" ON "ReputationEvent"("userId", "category");

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "BadgeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationEvent" ADD CONSTRAINT "ReputationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
