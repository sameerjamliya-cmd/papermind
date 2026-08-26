-- CreateTable
CREATE TABLE "audio_overview" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generating',
    "audioUrl" TEXT,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_overview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audio_overview_workspaceId_idx" ON "audio_overview"("workspaceId");

-- AddForeignKey
ALTER TABLE "audio_overview" ADD CONSTRAINT "audio_overview_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_overview" ADD CONSTRAINT "audio_overview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
