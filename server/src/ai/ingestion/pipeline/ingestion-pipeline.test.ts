import { describe, it, expect, vi } from "vitest";
import { IngestionPipeline } from "./ingestion-pipeline";
import { ResourceType } from "../../../domain/enums/resource-type";
import { KnowledgeResourceStatus } from "../../../domain/enums/knowledge-resource-status";
import {
  createResourceId,
  createWorkspaceId,
  createUserId,
} from "../../../domain/primitives/brand";
import type { IngestionState } from "../types/ingestion-state";
import type { Embedder } from "../../../application/ports/embedder";
import type { VectorIndexer } from "../../../application/ports/vector-indexer";
import type { KnowledgeResourceChunkRepository } from "../../../application/ports/knowledge-resource-chunk-repository";

function makeInitialState(): IngestionState {
  return {
    resourceId: createResourceId("res-1"),
    workspaceId: createWorkspaceId("ws-1"),
    userId: createUserId("user-1"),
    title: "Test Resource",
    type: ResourceType.Pdf,
    originalUrl: "https://cloudinary.test/file.pdf",
    publicId: "papermind/resources/test-file",
    metadata: {},
    status: KnowledgeResourceStatus.Processing,
    content: null,
    normalizedContent: null,
    chunks: [],
    embeddings: null,
    error: null,
  };
}

describe("IngestionPipeline", () => {
  it("executes all stages sequentially and produces chunks, embeddings, and persisted output", async () => {
    const embedder: Embedder = {
      embed: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    };
    const vectorIndexer: VectorIndexer = {
      index: vi.fn().mockResolvedValue(undefined),
    };
    const chunkRepository: KnowledgeResourceChunkRepository = {
      createMany: vi.fn().mockResolvedValue([]),
    };

    const pipeline = new IngestionPipeline({
      embedder,
      vectorIndexer,
      chunkRepository,
    });

    const result = await pipeline.run(makeInitialState());

    expect(result.aborted).toBe(false);
    expect(result.timings).toHaveLength(7);

    expect(result.state.content).toBe(
      "[placeholder PDF extraction for Test Resource]"
    );
    expect(result.state.normalizedContent).toBe(
      "[placeholder PDF extraction for Test Resource]"
    );
    expect(result.state.chunks.length).toBeGreaterThan(0);
    expect(result.state.embeddings).toEqual([[0.1, 0.2, 0.3]]);

    expect(embedder.embed).toHaveBeenCalledOnce();
    expect(vectorIndexer.index).toHaveBeenCalledOnce();
    expect(chunkRepository.createMany).toHaveBeenCalledOnce();
  });
});