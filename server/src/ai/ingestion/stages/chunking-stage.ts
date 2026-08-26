import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { IngestionState } from "../types/ingestion-state";
import { recursiveChunk } from "../chunking";

export class ChunkingStage implements PipelineStage<IngestionState> {
  readonly name = "chunking";

  async execute(state: IngestionState): Promise<IngestionState> {
    if (!state.normalizedContent || state.normalizedContent.trim().length === 0) {
      return { ...state, chunks: [] };
    }

    const chunks = recursiveChunk(state.normalizedContent, {
      chunkSize: 2048,
      chunkOverlap: 200,
    });

    return {
      ...state,
      chunks: chunks.map((chunk) => ({
        index: chunk.index,
        content: chunk.text,
      })),
    };
  }
}