-- AlterTable
ALTER TABLE "audio_overview" ADD COLUMN     "completedSections" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedTtsChunks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentStage" TEXT,
ADD COLUMN     "totalSections" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalTtsChunks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "chunk" ADD COLUMN     "pageNumber" INTEGER,
ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "document_section" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "parentId" TEXT,
    "startIndex" INTEGER NOT NULL,
    "endIndex" INTEGER NOT NULL,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_section" (
    "id" TEXT NOT NULL,
    "audioOverviewId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "targetWords" INTEGER NOT NULL,
    "retrievalQueries" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "text" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_tts_chunk" (
    "id" TEXT NOT NULL,
    "audioOverviewId" TEXT NOT NULL,
    "sectionId" TEXT,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tempAudioUrl" TEXT,
    "tempPublicId" TEXT,
    "duration" DOUBLE PRECISION,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_tts_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_section_sourceId_idx" ON "document_section"("sourceId");

-- CreateIndex
CREATE INDEX "document_section_workspaceId_idx" ON "document_section"("workspaceId");

-- CreateIndex
CREATE INDEX "audio_section_audioOverviewId_idx" ON "audio_section"("audioOverviewId");

-- CreateIndex
CREATE INDEX "audio_section_audioOverviewId_order_idx" ON "audio_section"("audioOverviewId", "order");

-- CreateIndex
CREATE INDEX "audio_tts_chunk_audioOverviewId_idx" ON "audio_tts_chunk"("audioOverviewId");

-- CreateIndex
CREATE INDEX "audio_tts_chunk_audioOverviewId_order_idx" ON "audio_tts_chunk"("audioOverviewId", "order");

-- CreateIndex
CREATE INDEX "chunk_sectionId_idx" ON "chunk"("sectionId");

-- AddForeignKey
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "document_section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_section" ADD CONSTRAINT "document_section_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_section" ADD CONSTRAINT "document_section_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "document_section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_section" ADD CONSTRAINT "audio_section_audioOverviewId_fkey" FOREIGN KEY ("audioOverviewId") REFERENCES "audio_overview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_tts_chunk" ADD CONSTRAINT "audio_tts_chunk_audioOverviewId_fkey" FOREIGN KEY ("audioOverviewId") REFERENCES "audio_overview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename existing audioLength values to the new mode names
UPDATE "audio_overview"
SET "audioLength" = CASE
  WHEN "audioLength" = 'quick' THEN 'brief'
  WHEN "audioLength" = 'standard' THEN 'long'
  WHEN "audioLength" = 'detailed' THEN 'long'
  ELSE "audioLength"
END
WHERE "audioLength" IN ('quick', 'standard', 'detailed');
