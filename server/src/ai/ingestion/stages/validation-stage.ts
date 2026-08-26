import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { IngestionState } from "../types/ingestion-state";

export const validationStage: PipelineStage<IngestionState> = {
  name: "validation",
  async execute(state) {
    return state;
  },
};