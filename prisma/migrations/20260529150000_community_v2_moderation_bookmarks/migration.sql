-- CreateEnum
CREATE TYPE "CommunityModerationStatus" AS ENUM ('visible', 'hidden', 'removed');
CREATE TYPE "CommunityReportStatus" AS ENUM ('pending', 'dismissed', 'actioned');
CREATE TYPE "CommunityReportTargetType" AS ENUM ('question', 'answer', 'post', 'thread');

-- AlterTable
ALTER TABLE "CommunityQuestion" ADD COLUMN "moderationStatus" "CommunityModerationStatus" NOT NULL DEFAULT 'visible';
ALTER TABLE "CommunityAnswer" ADD COLUMN "moderationStatus" "CommunityModerationStatus" NOT NULL DEFAULT 'visible';
ALTER TABLE "CommunityThread" ADD COLUMN "moderationStatus" "CommunityModerationStatus" NOT NULL DEFAULT 'visible';
ALTER TABLE "CommunityPost" ADD COLUMN "moderationStatus" "CommunityModerationStatus" NOT NULL DEFAULT 'visible';

-- CreateTable
CREATE TABLE "CommunityQuestionBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityQuestionBookmark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "CommunityReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "CommunityReportStatus" NOT NULL DEFAULT 'pending',
    "resolution" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityQuestion_moderationStatus_idx" ON "CommunityQuestion"("moderationStatus");
CREATE INDEX "CommunityAnswer_moderationStatus_idx" ON "CommunityAnswer"("moderationStatus");
CREATE INDEX "CommunityThread_moderationStatus_idx" ON "CommunityThread"("moderationStatus");
CREATE INDEX "CommunityPost_moderationStatus_idx" ON "CommunityPost"("moderationStatus");
CREATE UNIQUE INDEX "CommunityQuestionBookmark_userId_questionId_key" ON "CommunityQuestionBookmark"("userId", "questionId");
CREATE INDEX "CommunityQuestionBookmark_userId_idx" ON "CommunityQuestionBookmark"("userId");
CREATE INDEX "CommunityReport_status_createdAt_idx" ON "CommunityReport"("status", "createdAt");
CREATE INDEX "CommunityReport_targetType_targetId_idx" ON "CommunityReport"("targetType", "targetId");
CREATE INDEX "CommunityReport_reporterId_idx" ON "CommunityReport"("reporterId");

-- AddForeignKey
ALTER TABLE "CommunityQuestionBookmark" ADD CONSTRAINT "CommunityQuestionBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityQuestionBookmark" ADD CONSTRAINT "CommunityQuestionBookmark_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "CommunityQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
