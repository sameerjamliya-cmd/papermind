/*
  Warnings:

  - You are about to drop the column `audioLength` on the `audio_overview` table. All the data in the column will be lost.
  - You are about to drop the column `completedSections` on the `audio_overview` table. All the data in the column will be lost.
  - You are about to drop the column `completedTtsChunks` on the `audio_overview` table. All the data in the column will be lost.
  - You are about to drop the column `currentStage` on the `audio_overview` table. All the data in the column will be lost.
  - You are about to drop the column `totalSections` on the `audio_overview` table. All the data in the column will be lost.
  - You are about to drop the column `totalTtsChunks` on the `audio_overview` table. All the data in the column will be lost.
  - You are about to drop the column `sectionId` on the `chunk` table. All the data in the column will be lost.
  - You are about to drop the `audio_section` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audio_tts_chunk` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_section` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "audio_section" DROP CONSTRAINT "audio_section_audioOverviewId_fkey";

-- DropForeignKey
ALTER TABLE "audio_tts_chunk" DROP CONSTRAINT "audio_tts_chunk_audioOverviewId_fkey";

-- DropForeignKey
ALTER TABLE "chunk" DROP CONSTRAINT "chunk_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "document_section" DROP CONSTRAINT "document_section_parentId_fkey";

-- DropForeignKey
ALTER TABLE "document_section" DROP CONSTRAINT "document_section_sourceId_fkey";

-- DropIndex
DROP INDEX "chunk_sectionId_idx";

-- AlterTable
ALTER TABLE "audio_overview" DROP COLUMN "audioLength",
DROP COLUMN "completedSections",
DROP COLUMN "completedTtsChunks",
DROP COLUMN "currentStage",
DROP COLUMN "totalSections",
DROP COLUMN "totalTtsChunks";

-- AlterTable
ALTER TABLE "chunk" DROP COLUMN "sectionId";

-- DropTable
DROP TABLE "audio_section";

-- DropTable
DROP TABLE "audio_tts_chunk";

-- DropTable
DROP TABLE "document_section";

-- CreateTable
CREATE TABLE "memory_sync" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "lastSyncedMessageId" TEXT,
    "messageCountSinceSync" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generating',
    "config" JSONB NOT NULL,
    "questions" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memory_sync_userId_idx" ON "memory_sync"("userId");

-- CreateIndex
CREATE INDEX "memory_sync_workspaceId_idx" ON "memory_sync"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "memory_sync_userId_workspaceId_key" ON "memory_sync"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX "quiz_workspaceId_idx" ON "quiz"("workspaceId");

-- CreateIndex
CREATE INDEX "quiz_workspaceId_status_idx" ON "quiz"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
