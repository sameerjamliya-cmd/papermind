import { MemoryClient } from "mem0ai";
import { getEnv } from "../../config/env";
import type { MemoryStore } from "../../application/ports/memory-store";

let _client: MemoryClient | null = null;

function getClient(): MemoryClient | null {
  if (_client) return _client;
  const env = getEnv();
  if (!env.MEM0_API_KEY) {
    return null;
  }
  _client = new MemoryClient({ apiKey: env.MEM0_API_KEY });
  return _client;
}

export const mem0MemoryStore: MemoryStore = {
  async save(
    userId: string,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const client = getClient();
    if (!client) return;

    await client.add(
      [{ role: "user", content }],
      {
        user_id: userId,
        metadata: metadata ?? {},
      } as any
    );
  },

  async getLatest(userId: string): Promise<string | null> {
    const client = getClient();
    if (!client) return null;

    try {
      const response = await client.getAll({
        filters: { user_id: userId },
        pageSize: 1,
      } as any);

      const memories = response.results;
      if (!memories || memories.length === 0) return null;

      const first = memories[0];
      return first?.memory ?? null;
    } catch {
      return null;
    }
  },
};
