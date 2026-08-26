import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { IngestionState } from "../types/ingestion-state";
import type { Extractor } from "../extractors/extractor";
import { ResourceType } from "../../../domain/enums/resource-type";

export class ExtractionStage implements PipelineStage<IngestionState> {
  readonly name = "extraction";

  constructor(
    private readonly extractors: Record<ResourceType, Extractor>
  ) {}

  async execute(state: IngestionState): Promise<IngestionState> {
    const extractor = this.extractors[state.type];
    if (!extractor) {
      throw new Error(`No extractor configured for type: ${state.type}`);
    }

    const content = await extractor.extract({
      title: state.title,
      originalUrl: state.originalUrl,
      metadata: state.metadata,
    });

    return { ...state, content };
  }
}