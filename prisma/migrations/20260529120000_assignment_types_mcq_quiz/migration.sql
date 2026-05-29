-- CreateEnum
CREATE TYPE "CourseAssignmentType" AS ENUM ('text', 'mcq', 'quiz');

-- AlterTable
ALTER TABLE "CourseAssignment" ADD COLUMN "assignmentType" "CourseAssignmentType" NOT NULL DEFAULT 'text';
ALTER TABLE "CourseAssignment" ADD COLUMN "configJson" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "AssignmentSubmission" ADD COLUMN "answersJson" JSONB NOT NULL DEFAULT '{}';
