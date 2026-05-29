-- CourseEnrollmentRequest for private course access requests
CREATE TYPE "CourseEnrollmentRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "CourseEnrollmentRequest" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "CourseEnrollmentRequestStatus" NOT NULL DEFAULT 'pending',
  "message" VARCHAR(500),
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CourseEnrollmentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseEnrollmentRequest_courseId_userId_key"
  ON "CourseEnrollmentRequest"("courseId", "userId");

CREATE INDEX "CourseEnrollmentRequest_courseId_status_idx"
  ON "CourseEnrollmentRequest"("courseId", "status");

ALTER TABLE "CourseEnrollmentRequest"
  ADD CONSTRAINT "CourseEnrollmentRequest_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseEnrollmentRequest"
  ADD CONSTRAINT "CourseEnrollmentRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseEnrollmentRequest"
  ADD CONSTRAINT "CourseEnrollmentRequest_reviewedBy_fkey"
  FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
