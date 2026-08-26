-- CreateTable
CREATE TABLE "audio_segment" (
    "id" TEXT NOT NULL,
    "audioOverviewId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_segment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audio_segment_audioOverviewId_idx" ON "audio_segment"("audioOverviewId");

-- CreateIndex
CREATE INDEX "audio_segment_audioOverviewId_order_idx" ON "audio_segment"("audioOverviewId", "order");

-- AddForeignKey
ALTER TABLE "audio_segment" ADD CONSTRAINT "audio_segment_audioOverviewId_fkey" FOREIGN KEY ("audioOverviewId") REFERENCES "audio_overview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
