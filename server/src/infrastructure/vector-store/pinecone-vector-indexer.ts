import type {
  VectorIndexer,
  VectorIndexerInput,
} from "../../application/ports/vector-indexer";
import { upsertVectors } from "./pinecone-client";

export class PineconeVectorIndexer implements VectorIndexer {
  async index(input: VectorIndexerInput): Promise<void> {
    const vectors = input.chunks.map((chunk) => ({
      id: `${input.resourceId}-${chunk.index}`,
      values: [...chunk.embedding],
      metadata: {
        resourceId: input.resourceId,
        workspaceId: input.workspaceId,
        chunkIndex: chunk.index,
        text: chunk.text.slice(0, 1000),
      },
    }));

    await upsertVectors(vectors);
  }
}