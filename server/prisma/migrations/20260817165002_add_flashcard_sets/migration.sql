-- CreateTable
CREATE TABLE "flashcard_set" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generating',
    "config" JSONB NOT NULL,
    "cards" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flashcard_set_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flashcard_set_workspaceId_idx" ON "flashcard_set"("workspaceId");

-- CreateIndex
CREATE INDEX "flashcard_set_workspaceId_status_idx" ON "flashcard_set"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "flashcard_set" ADD CONSTRAINT "flashcard_set_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcard_set" ADD CONSTRAINT "flashcard_set_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
