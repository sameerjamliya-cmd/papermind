-- AlterTable
ALTER TABLE "workspace" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "shared_workspace" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'read',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_collection" (
    "sourceId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    CONSTRAINT "source_collection_pkey" PRIMARY KEY ("sourceId","collectionId")
);

-- CreateTable
CREATE TABLE "knowledge_resource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "title" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "chunkCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_resource_chunk" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_resource_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chunk" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shared_workspace_sharedWithId_idx" ON "shared_workspace"("sharedWithId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_workspace_workspaceId_sharedWithId_key" ON "shared_workspace"("workspaceId", "sharedWithId");

-- CreateIndex
CREATE INDEX "collection_userId_idx" ON "collection"("userId");

-- CreateIndex
CREATE INDEX "knowledge_resource_workspaceId_idx" ON "knowledge_resource"("workspaceId");

-- CreateIndex
CREATE INDEX "knowledge_resource_userId_idx" ON "knowledge_resource"("userId");

-- CreateIndex
CREATE INDEX "knowledge_resource_workspaceId_status_idx" ON "knowledge_resource"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "knowledge_resource_chunk_resourceId_idx" ON "knowledge_resource_chunk"("resourceId");

-- CreateIndex
CREATE INDEX "knowledge_resource_chunk_workspaceId_idx" ON "knowledge_resource_chunk"("workspaceId");

-- CreateIndex
CREATE INDEX "chunk_sourceId_idx" ON "chunk"("sourceId");

-- CreateIndex
CREATE INDEX "chunk_workspaceId_idx" ON "chunk"("workspaceId");

-- CreateIndex
CREATE INDEX "message_workspaceId_idx" ON "message"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_userId_isFavorite_idx" ON "workspace"("userId", "isFavorite");

-- AddForeignKey
ALTER TABLE "shared_workspace" ADD CONSTRAINT "shared_workspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_workspace" ADD CONSTRAINT "shared_workspace_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_collection" ADD CONSTRAINT "source_collection_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_collection" ADD CONSTRAINT "source_collection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resource" ADD CONSTRAINT "knowledge_resource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resource" ADD CONSTRAINT "knowledge_resource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resource_chunk" ADD CONSTRAINT "knowledge_resource_chunk_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "knowledge_resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
