import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { IngestionState } from "../types/ingestion-state";
import type { VectorIndexer } from "../../../application/ports/vector-indexer";

export class IndexingStage implements PipelineStage<IngestionState> {
  readonly name = "indexing";

  constructor(private readonly vectorIndexer: VectorIndexer) {}

  async execute(state: IngestionState): Promise<IngestionState> {
    if (!state.embeddings || state.embeddings.length === 0) {
      return state;
    }

    const chunks = state.chunks.map((chunk, index) => ({
      index: chunk.index,
      text: chunk.content,
      embedding: state.embeddings![index],
    }));

    await this.vectorIndexer.index({
      resourceId: state.resourceId,
      workspaceId: state.workspaceId,
      chunks,
    });

    return state;
  }
}