/*
  Warnings:

  - Added the required column `sessionId` to the `GeneratedAudio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneratedAudio" ADD COLUMN     "sessionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SpeakSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeakSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpeakSession_userId_updatedAt_idx" ON "SpeakSession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "GeneratedAudio_sessionId_createdAt_idx" ON "GeneratedAudio"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "SpeakSession" ADD CONSTRAINT "SpeakSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedAudio" ADD CONSTRAINT "GeneratedAudio_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SpeakSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
