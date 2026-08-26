-- CreateTable
CREATE TABLE "source" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "fileUrl" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "chunkCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "source_workspaceId_idx" ON "source"("workspaceId");

-- CreateIndex
CREATE INDEX "source_userId_idx" ON "source"("userId");

-- CreateIndex
CREATE INDEX "source_workspaceId_type_idx" ON "source"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "source_workspaceId_status_idx" ON "source"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "source" ADD CONSTRAINT "source_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source" ADD CONSTRAINT "source_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
