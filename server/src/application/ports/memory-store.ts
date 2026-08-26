export interface MemoryStore {
  save(
    userId: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;
  getLatest(userId: string): Promise<string | null>;
}
