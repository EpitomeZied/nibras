-- Competitions feature: contests, problems, linked accounts, rankings

-- 1. Create enums
DO $$ BEGIN
  CREATE TYPE "CompPlatform" AS ENUM ('codeforces', 'leetcode', 'atcoder', 'codechef', 'vjudge');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AccountVerificationStatus" AS ENUM ('pending', 'verified', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Contest
CREATE TABLE IF NOT EXISTS "Contest" (
  "id"                TEXT         NOT NULL,
  "platform"          "CompPlatform" NOT NULL,
  "platformContestId" TEXT         NOT NULL,
  "name"              TEXT         NOT NULL,
  "url"               TEXT         NOT NULL,
  "startsAt"          TIMESTAMP(3) NOT NULL,
  "endsAt"            TIMESTAMP(3) NOT NULL,
  "durationMinutes"   INTEGER      NOT NULL,
  "phase"             TEXT         NOT NULL DEFAULT 'BEFORE',
  "tags"              TEXT[]       DEFAULT '{}',
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Contest_platform_platformContestId_key"
  ON "Contest"("platform", "platformContestId");

CREATE INDEX IF NOT EXISTS "Contest_startsAt_idx"
  ON "Contest"("startsAt");

CREATE INDEX IF NOT EXISTS "Contest_platform_startsAt_idx"
  ON "Contest"("platform", "startsAt");

-- 3. ContestBookmark
CREATE TABLE IF NOT EXISTS "ContestBookmark" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "contestId" TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContestBookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContestBookmark_userId_contestId_key"
  ON "ContestBookmark"("userId", "contestId");

CREATE INDEX IF NOT EXISTS "ContestBookmark_userId_idx"
  ON "ContestBookmark"("userId");

ALTER TABLE "ContestBookmark"
  ADD CONSTRAINT "ContestBookmark_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContestBookmark"
  ADD CONSTRAINT "ContestBookmark_contestId_fkey"
  FOREIGN KEY ("contestId") REFERENCES "Contest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. ContestReminder
CREATE TABLE IF NOT EXISTS "ContestReminder" (
  "id"            TEXT         NOT NULL,
  "userId"        TEXT         NOT NULL,
  "contestId"     TEXT         NOT NULL,
  "minutesBefore" INTEGER      NOT NULL DEFAULT 30,
  "notified"      BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContestReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ContestReminder_userId_contestId_key"
  ON "ContestReminder"("userId", "contestId");

CREATE INDEX IF NOT EXISTS "ContestReminder_notified_contestId_idx"
  ON "ContestReminder"("notified", "contestId");

ALTER TABLE "ContestReminder"
  ADD CONSTRAINT "ContestReminder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContestReminder"
  ADD CONSTRAINT "ContestReminder_contestId_fkey"
  FOREIGN KEY ("contestId") REFERENCES "Contest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Problem
CREATE TABLE IF NOT EXISTS "Problem" (
  "id"                TEXT         NOT NULL,
  "platform"          "CompPlatform" NOT NULL,
  "platformProblemId" TEXT         NOT NULL,
  "title"             TEXT         NOT NULL,
  "url"               TEXT         NOT NULL,
  "difficulty"        INTEGER      NOT NULL DEFAULT 0,
  "tags"              TEXT[]       DEFAULT '{}',
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Problem_platform_platformProblemId_key"
  ON "Problem"("platform", "platformProblemId");

CREATE INDEX IF NOT EXISTS "Problem_platform_idx"
  ON "Problem"("platform");

CREATE INDEX IF NOT EXISTS "Problem_difficulty_idx"
  ON "Problem"("difficulty");

-- 6. ProblemBookmark
CREATE TABLE IF NOT EXISTS "ProblemBookmark" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "problemId" TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProblemBookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProblemBookmark_userId_problemId_key"
  ON "ProblemBookmark"("userId", "problemId");

CREATE INDEX IF NOT EXISTS "ProblemBookmark_userId_idx"
  ON "ProblemBookmark"("userId");

ALTER TABLE "ProblemBookmark"
  ADD CONSTRAINT "ProblemBookmark_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProblemBookmark"
  ADD CONSTRAINT "ProblemBookmark_problemId_fkey"
  FOREIGN KEY ("problemId") REFERENCES "Problem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. UserProblemProgress
CREATE TABLE IF NOT EXISTS "UserProblemProgress" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "problemId" TEXT         NOT NULL,
  "solved"    BOOLEAN      NOT NULL DEFAULT false,
  "solvedAt"  TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserProblemProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserProblemProgress_userId_problemId_key"
  ON "UserProblemProgress"("userId", "problemId");

CREATE INDEX IF NOT EXISTS "UserProblemProgress_userId_solved_idx"
  ON "UserProblemProgress"("userId", "solved");

ALTER TABLE "UserProblemProgress"
  ADD CONSTRAINT "UserProblemProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserProblemProgress"
  ADD CONSTRAINT "UserProblemProgress_problemId_fkey"
  FOREIGN KEY ("problemId") REFERENCES "Problem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. LinkedAccount
CREATE TABLE IF NOT EXISTS "LinkedAccount" (
  "id"                  TEXT                        NOT NULL,
  "userId"              TEXT                        NOT NULL,
  "platform"            "CompPlatform"              NOT NULL,
  "handle"              TEXT                        NOT NULL,
  "verificationStatus"  "AccountVerificationStatus" NOT NULL DEFAULT 'pending',
  "verificationProblem" TEXT,
  "verifiedAt"          TIMESTAMP(3),
  "platformRating"      INTEGER,
  "platformMaxRating"   INTEGER,
  "lastSyncAt"          TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LinkedAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LinkedAccount_userId_platform_key"
  ON "LinkedAccount"("userId", "platform");

CREATE UNIQUE INDEX IF NOT EXISTS "LinkedAccount_platform_handle_key"
  ON "LinkedAccount"("platform", "handle");

CREATE INDEX IF NOT EXISTS "LinkedAccount_userId_idx"
  ON "LinkedAccount"("userId");

ALTER TABLE "LinkedAccount"
  ADD CONSTRAINT "LinkedAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. UserContestParticipation
CREATE TABLE IF NOT EXISTS "UserContestParticipation" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "contestId"    TEXT         NOT NULL,
  "platform"     "CompPlatform" NOT NULL,
  "rank"         INTEGER,
  "participants" INTEGER,
  "ratingBefore" INTEGER,
  "ratingAfter"  INTEGER,
  "delta"        INTEGER,
  "solvedCount"  INTEGER,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserContestParticipation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserContestParticipation_userId_contestId_key"
  ON "UserContestParticipation"("userId", "contestId");

CREATE INDEX IF NOT EXISTS "UserContestParticipation_userId_platform_idx"
  ON "UserContestParticipation"("userId", "platform");

CREATE INDEX IF NOT EXISTS "UserContestParticipation_userId_createdAt_idx"
  ON "UserContestParticipation"("userId", "createdAt");

ALTER TABLE "UserContestParticipation"
  ADD CONSTRAINT "UserContestParticipation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserContestParticipation"
  ADD CONSTRAINT "UserContestParticipation_contestId_fkey"
  FOREIGN KEY ("contestId") REFERENCES "Contest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. CachedRanking
CREATE TABLE IF NOT EXISTS "CachedRanking" (
  "id"              TEXT         NOT NULL,
  "userId"          TEXT         NOT NULL,
  "scope"           TEXT         NOT NULL,
  "platform"        TEXT         NOT NULL,
  "rank"            INTEGER      NOT NULL,
  "rating"          INTEGER      NOT NULL,
  "delta"           INTEGER      NOT NULL DEFAULT 0,
  "contestsLast30d" INTEGER      NOT NULL DEFAULT 0,
  "calculatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CachedRanking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CachedRanking_userId_scope_platform_key"
  ON "CachedRanking"("userId", "scope", "platform");

CREATE INDEX IF NOT EXISTS "CachedRanking_scope_platform_rank_idx"
  ON "CachedRanking"("scope", "platform", "rank");

ALTER TABLE "CachedRanking"
  ADD CONSTRAINT "CachedRanking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. CompSyncLog
CREATE TABLE IF NOT EXISTS "CompSyncLog" (
  "id"           TEXT         NOT NULL,
  "jobType"      TEXT         NOT NULL,
  "platform"     TEXT,
  "status"       TEXT         NOT NULL,
  "itemCount"    INTEGER      NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "startedAt"    TIMESTAMP(3) NOT NULL,
  "finishedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CompSyncLog_jobType_createdAt_idx"
  ON "CompSyncLog"("jobType", "createdAt");
