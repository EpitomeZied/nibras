-- Tutor conversations: persistent chat history for the AI Tutor

-- 1. TutorConversation
CREATE TABLE IF NOT EXISTS "TutorConversation" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "title"     TEXT         NOT NULL DEFAULT 'New conversation',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TutorConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TutorConversation_userId_updatedAt_idx"
  ON "TutorConversation"("userId", "updatedAt");

ALTER TABLE "TutorConversation"
  DROP CONSTRAINT IF EXISTS "TutorConversation_userId_fkey";
ALTER TABLE "TutorConversation"
  ADD CONSTRAINT "TutorConversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. TutorMessage
CREATE TABLE IF NOT EXISTS "TutorMessage" (
  "id"                  TEXT         NOT NULL,
  "conversationId"      TEXT         NOT NULL,
  "role"                TEXT         NOT NULL,
  "content"             TEXT         NOT NULL,
  "tags"                TEXT[]       DEFAULT '{}',
  "xaiReasoning"        TEXT,
  "xaiConcepts"         TEXT[]       DEFAULT '{}',
  "xaiUnclear"          TEXT[]       DEFAULT '{}',
  "responseType"        TEXT,
  "communityQuestionId" TEXT,
  "matchScore"          DOUBLE PRECISION,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TutorMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TutorMessage_conversationId_createdAt_idx"
  ON "TutorMessage"("conversationId", "createdAt");

ALTER TABLE "TutorMessage"
  DROP CONSTRAINT IF EXISTS "TutorMessage_conversationId_fkey";
ALTER TABLE "TutorMessage"
  ADD CONSTRAINT "TutorMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "TutorConversation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
