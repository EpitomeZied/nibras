-- Nibras 75 GitHub workspace + extended competition platforms

DO $$ BEGIN
  ALTER TYPE "CompPlatform" ADD VALUE 'ctftime';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CompPlatform" ADD VALUE 'kaggle';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CompPlatform" ADD VALUE 'hackthebox';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CompPlatform" ADD VALUE 'tryhackme';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CompPlatform" ADD VALUE 'picoctf';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CompPlatform" ADD VALUE 'project_euler';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CompPlatform" ADD VALUE 'hackerone';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CompPlatform" ADD VALUE 'bugcrowd';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "CompPlatform" ADD VALUE 'defcon';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Nibras75Workspace" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "owner"     TEXT         NOT NULL,
  "repoName"  TEXT         NOT NULL,
  "fullName"  TEXT         NOT NULL,
  "htmlUrl"   TEXT         NOT NULL,
  "cloneUrl"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Nibras75Workspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Nibras75Workspace_userId_key"
  ON "Nibras75Workspace"("userId");

CREATE INDEX IF NOT EXISTS "Nibras75Workspace_userId_idx"
  ON "Nibras75Workspace"("userId");

DO $$ BEGIN
  ALTER TABLE "Nibras75Workspace"
    ADD CONSTRAINT "Nibras75Workspace_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
