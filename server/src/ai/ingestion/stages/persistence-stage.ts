import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { IngestionState } from "../types/ingestion-state";
import type { KnowledgeResourceChunkRepository } from "../../../application/ports/knowledge-resource-chunk-repository";

export class PersistenceStage implements PipelineStage<IngestionState> {
  readonly name = "persistence";

  constructor(private readonly chunkRepository: KnowledgeResourceChunkRepository) {}

  async execute(state: IngestionState): Promise<IngestionState> {
    if (!state.embeddings || state.embeddings.length === 0) {
      return state;
    }

    const chunks = state.chunks.map((chunk, index) => ({
      resourceId: state.resourceId,
      workspaceId: state.workspaceId,
      index: chunk.index,
      text: chunk.content,
      embedding: state.embeddings![index],
    }));

    await this.chunkRepository.createMany(chunks);

    return state;
  }
}