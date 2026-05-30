-- CreateTable
CREATE TABLE "Nibras75Config" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeklyPace" INTEGER NOT NULL DEFAULT 5,
    "targetDate" TIMESTAMP(3),
    "useForDailyProblem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nibras75Config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nibras75Config_userId_key" ON "Nibras75Config"("userId");

-- CreateIndex
CREATE INDEX "Nibras75Config_userId_idx" ON "Nibras75Config"("userId");

-- AddForeignKey
ALTER TABLE "Nibras75Config" ADD CONSTRAINT "Nibras75Config_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
