-- CreateTable
CREATE TABLE "infographic" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generating',
    "config" JSONB NOT NULL,
    "content" JSONB,
    "language" TEXT NOT NULL DEFAULT 'en',
    "plannerVersion" INTEGER NOT NULL DEFAULT 1,
    "rendererVersion" INTEGER NOT NULL DEFAULT 1,
    "cacheKey" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infographic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "infographic_workspaceId_idx" ON "infographic"("workspaceId");

-- CreateIndex
CREATE INDEX "infographic_workspaceId_status_idx" ON "infographic"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "infographic_workspaceId_cacheKey_key" ON "infographic"("workspaceId", "cacheKey");

-- AddForeignKey
ALTER TABLE "infographic" ADD CONSTRAINT "infographic_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infographic" ADD CONSTRAINT "infographic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
