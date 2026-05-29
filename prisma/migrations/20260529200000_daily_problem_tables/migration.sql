-- Daily Problem System (DailyProblemConfig + DailyProblemAssignment)

CREATE TABLE "DailyProblemConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "difficultyPref" INTEGER[] NOT NULL DEFAULT '{}',
    "tagPrefs" TEXT[] NOT NULL DEFAULT '{}',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "pausedUntil" TIMESTAMP(3),
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedDate" TEXT,
    "streakFreezes" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyProblemConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyProblemConfig_userId_key" ON "DailyProblemConfig"("userId");

CREATE INDEX "DailyProblemConfig_userId_idx" ON "DailyProblemConfig"("userId");

ALTER TABLE "DailyProblemConfig" ADD CONSTRAINT "DailyProblemConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DailyProblemAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "assignedDate" TEXT NOT NULL,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "solvedAt" TIMESTAMP(3),
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "missedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyProblemAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyProblemAssignment_userId_assignedDate_key" ON "DailyProblemAssignment"("userId", "assignedDate");

CREATE INDEX "DailyProblemAssignment_userId_solved_idx" ON "DailyProblemAssignment"("userId", "solved");

CREATE INDEX "DailyProblemAssignment_userId_assignedDate_idx" ON "DailyProblemAssignment"("userId", "assignedDate");

ALTER TABLE "DailyProblemAssignment" ADD CONSTRAINT "DailyProblemAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyProblemAssignment" ADD CONSTRAINT "DailyProblemAssignment_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyProblemAssignment" ADD CONSTRAINT "DailyProblemAssignment_configId_fkey" FOREIGN KEY ("configId") REFERENCES "DailyProblemConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
