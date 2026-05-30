-- AlterTable
ALTER TABLE "CourseVideo" ADD COLUMN "resourcesJson" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "CourseVideoComment" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "moderationStatus" "CommunityModerationStatus" NOT NULL DEFAULT 'visible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseVideoComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseVideoComment_videoId_createdAt_idx" ON "CourseVideoComment"("videoId", "createdAt");

-- CreateIndex
CREATE INDEX "CourseVideoComment_authorId_idx" ON "CourseVideoComment"("authorId");

-- CreateIndex
CREATE INDEX "CourseVideoComment_moderationStatus_idx" ON "CourseVideoComment"("moderationStatus");

-- AddForeignKey
ALTER TABLE "CourseVideoComment" ADD CONSTRAINT "CourseVideoComment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "CourseVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseVideoComment" ADD CONSTRAINT "CourseVideoComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
