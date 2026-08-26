export interface MemorySyncRecord {
  id: string;
  userId: string;
  workspaceId: string;
  lastSyncedMessageId: string | null;
  messageCountSinceSync: number;
  lastSyncedAt: Date;
}

export interface MemorySyncRepository {
  find(userId: string, workspaceId: string): Promise<MemorySyncRecord | null>;
  increment(userId: string, workspaceId: string): Promise<void>;
  markSynced(
    userId: string,
    workspaceId: string,
    lastMessageId: string
  ): Promise<void>;
}
