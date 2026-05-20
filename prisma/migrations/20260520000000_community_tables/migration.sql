-- Community Q&A tables: questions, answers, votes, tags, threads, posts

-- 1. Create the CommunityVoteTargetType enum
DO $$ BEGIN
  CREATE TYPE "CommunityVoteTargetType" AS ENUM ('question', 'answer', 'post');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. CommunityQuestion
CREATE TABLE IF NOT EXISTS "CommunityQuestion" (
  "id"               TEXT         NOT NULL,
  "authorId"         TEXT         NOT NULL,
  "title"            TEXT         NOT NULL,
  "body"             TEXT         NOT NULL,
  "tags"             TEXT[]       DEFAULT '{}',
  "votesCount"       INTEGER      NOT NULL DEFAULT 0,
  "answersCount"     INTEGER      NOT NULL DEFAULT 0,
  "acceptedAnswerId" TEXT,
  "viewCount"        INTEGER      NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunityQuestion_authorId_idx"
  ON "CommunityQuestion"("authorId");

CREATE INDEX IF NOT EXISTS "CommunityQuestion_createdAt_idx"
  ON "CommunityQuestion"("createdAt");

ALTER TABLE "CommunityQuestion"
  ADD CONSTRAINT "CommunityQuestion_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. CommunityAnswer
CREATE TABLE IF NOT EXISTS "CommunityAnswer" (
  "id"         TEXT         NOT NULL,
  "questionId" TEXT         NOT NULL,
  "authorId"   TEXT         NOT NULL,
  "body"       TEXT         NOT NULL,
  "votesCount" INTEGER      NOT NULL DEFAULT 0,
  "accepted"   BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityAnswer_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunityAnswer_questionId_idx"
  ON "CommunityAnswer"("questionId");

CREATE INDEX IF NOT EXISTS "CommunityAnswer_authorId_idx"
  ON "CommunityAnswer"("authorId");

ALTER TABLE "CommunityAnswer"
  ADD CONSTRAINT "CommunityAnswer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "CommunityQuestion"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityAnswer"
  ADD CONSTRAINT "CommunityAnswer_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. CommunityVote
CREATE TABLE IF NOT EXISTS "CommunityVote" (
  "id"         TEXT                       NOT NULL,
  "targetType" "CommunityVoteTargetType"  NOT NULL,
  "targetId"   TEXT                       NOT NULL,
  "value"      INTEGER                    NOT NULL,
  "userId"     TEXT                       NOT NULL,
  "createdAt"  TIMESTAMP(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3)              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommunityVote_userId_targetType_targetId_key"
  ON "CommunityVote"("userId", "targetType", "targetId");

CREATE INDEX IF NOT EXISTS "CommunityVote_targetType_targetId_idx"
  ON "CommunityVote"("targetType", "targetId");

ALTER TABLE "CommunityVote"
  ADD CONSTRAINT "CommunityVote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. CommunityTag
CREATE TABLE IF NOT EXISTS "CommunityTag" (
  "id"          TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "description" TEXT         NOT NULL DEFAULT '',
  "usageCount"  INTEGER      NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommunityTag_name_key"
  ON "CommunityTag"("name");

-- 6. CommunityThread
CREATE TABLE IF NOT EXISTS "CommunityThread" (
  "id"         TEXT         NOT NULL,
  "courseId"    TEXT         NOT NULL,
  "authorId"   TEXT         NOT NULL,
  "title"      TEXT         NOT NULL,
  "body"       TEXT         NOT NULL DEFAULT '',
  "tags"       TEXT[]       DEFAULT '{}',
  "pinned"     BOOLEAN      NOT NULL DEFAULT false,
  "closed"     BOOLEAN      NOT NULL DEFAULT false,
  "postsCount" INTEGER      NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityThread_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunityThread_courseId_createdAt_idx"
  ON "CommunityThread"("courseId", "createdAt");

CREATE INDEX IF NOT EXISTS "CommunityThread_authorId_idx"
  ON "CommunityThread"("authorId");

ALTER TABLE "CommunityThread"
  ADD CONSTRAINT "CommunityThread_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityThread"
  ADD CONSTRAINT "CommunityThread_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. CommunityPost
CREATE TABLE IF NOT EXISTS "CommunityPost" (
  "id"         TEXT         NOT NULL,
  "threadId"   TEXT         NOT NULL,
  "authorId"   TEXT         NOT NULL,
  "body"       TEXT         NOT NULL,
  "votesCount" INTEGER      NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunityPost_threadId_createdAt_idx"
  ON "CommunityPost"("threadId", "createdAt");

CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_idx"
  ON "CommunityPost"("authorId");

ALTER TABLE "CommunityPost"
  ADD CONSTRAINT "CommunityPost_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "CommunityThread"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPost"
  ADD CONSTRAINT "CommunityPost_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
