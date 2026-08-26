import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { IngestionState } from "../types/ingestion-state";
import type { Embedder } from "../../../application/ports/embedder";

export class EmbeddingStage implements PipelineStage<IngestionState> {
  readonly name = "embedding";

  constructor(private readonly embedder: Embedder) {}

  async execute(state: IngestionState): Promise<IngestionState> {
    if (state.chunks.length === 0) {
      return { ...state, embeddings: [] };
    }

    const texts = state.chunks.map((chunk) => chunk.content);
    const embeddings = await this.embedder.embed(texts);

    return { ...state, embeddings };
  }
}