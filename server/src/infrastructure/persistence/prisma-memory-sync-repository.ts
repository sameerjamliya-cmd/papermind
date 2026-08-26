import { prisma } from "../../lib/db";
import type {
  MemorySyncRecord,
  MemorySyncRepository,
} from "../../application/ports/memory-sync-repository";

export class PrismaMemorySyncRepository implements MemorySyncRepository {
  async find(
    userId: string,
    workspaceId: string
  ): Promise<MemorySyncRecord | null> {
    const record = await prisma.memorySync.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!record) return null;

    return {
      id: record.id,
      userId: record.userId,
      workspaceId: record.workspaceId,
      lastSyncedMessageId: record.lastSyncedMessageId,
      messageCountSinceSync: record.messageCountSinceSync,
      lastSyncedAt: record.lastSyncedAt,
    };
  }

  async increment(userId: string, workspaceId: string): Promise<void> {
    await prisma.memorySync.upsert({
      where: { userId_workspaceId: { userId, workspaceId } },
      create: {
        userId,
        workspaceId,
        lastSyncedMessageId: null,
        messageCountSinceSync: 1,
      },
      update: {
        messageCountSinceSync: { increment: 1 },
      },
    });
  }

  async markSynced(
    userId: string,
    workspaceId: string,
    lastMessageId: string
  ): Promise<void> {
    await prisma.memorySync.upsert({
      where: { userId_workspaceId: { userId, workspaceId } },
      create: {
        userId,
        workspaceId,
        lastSyncedMessageId: lastMessageId,
        messageCountSinceSync: 0,
      },
      update: {
        lastSyncedMessageId: lastMessageId,
        messageCountSinceSync: 0,
        lastSyncedAt: new Date(),
      },
    });
  }
}
