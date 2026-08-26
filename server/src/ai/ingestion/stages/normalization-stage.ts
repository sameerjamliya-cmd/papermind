import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { IngestionState } from "../types/ingestion-state";

export const normalizationStage: PipelineStage<IngestionState> = {
  name: "normalization",
  async execute(state) {
    return {
      ...state,
      normalizedContent: state.content?.trim() ?? "",
    };
  },
};