-- AlterTable Course
ALTER TABLE "Course" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Course" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN "syllabusJson" JSONB;
ALTER TABLE "Course" ADD COLUMN "sequentialVideos" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "AssignmentSubmissionStatus" AS ENUM ('draft', 'submitted', 'graded');

-- CreateTable CourseAssignment
CREATE TABLE "CourseAssignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "dueAt" TIMESTAMP(3),
    "pointsPossible" INTEGER NOT NULL DEFAULT 100,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable AssignmentSubmission
CREATE TABLE "AssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "resourcesJson" JSONB NOT NULL DEFAULT '[]',
    "status" "AssignmentSubmissionStatus" NOT NULL DEFAULT 'draft',
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- AlterTable CourseVideo
ALTER TABLE "CourseVideo" ADD COLUMN "requiresVideoId" TEXT;
ALTER TABLE "CourseVideo" ADD COLUMN "linkedProjectId" TEXT;
ALTER TABLE "CourseVideo" ADD COLUMN "linkedMilestoneId" TEXT;

-- CreateIndex
CREATE INDEX "CourseAssignment_courseId_sortOrder_idx" ON "CourseAssignment"("courseId", "sortOrder");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_userId_idx" ON "AssignmentSubmission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_assignmentId_userId_key" ON "AssignmentSubmission"("assignmentId", "userId");

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "CourseAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseVideo" ADD CONSTRAINT "CourseVideo_requiresVideoId_fkey" FOREIGN KEY ("requiresVideoId") REFERENCES "CourseVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseVideo" ADD CONSTRAINT "CourseVideo_linkedProjectId_fkey" FOREIGN KEY ("linkedProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
