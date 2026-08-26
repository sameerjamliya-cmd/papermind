import { Pinecone } from "@pinecone-database/pinecone";
import { getEnv } from "../../config/env";

let _index: ReturnType<Pinecone["index"]> | null = null;

export function getPineconeIndex() {
  if (_index) return _index;
  const env = getEnv();
  if (!env.PINECONE_API_KEY || !env.PINECONE_INDEX) {
    throw new Error("Pinecone is not configured");
  }
  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  _index = pc.index(env.PINECONE_INDEX);
  return _index;
}

export async function upsertChunks(
  vectors: Array<{
    id: string;
    values: number[];
    metadata: Record<string, string | number>;
  }>
) {
  const index = getPineconeIndex();
  const BATCH_SIZE = 100;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await index.upsert({ records: batch, namespace: "papermind" });
  }
}

export async function querySimilar(
  embedding: number[],
  topK: number,
  workspaceId: string
) {
  const index = getPineconeIndex();
  const results = await index.namespace("papermind").query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: { workspaceId },
  });
  return results.matches;
}

export async function deleteBySourceId(sourceId: string) {
  const index = getPineconeIndex();
  try {
    await index.namespace("papermind").deleteMany({
      filter: { sourceId },
    });
  } catch {
    // data plane may not be ready yet — safe to skip pre-cleanup
  }
}