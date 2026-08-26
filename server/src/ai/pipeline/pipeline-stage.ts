import type { PipelineState } from "./pipeline-state";

export interface PipelineStage<T extends PipelineState = PipelineState> {
  readonly name: string;
  execute(state: T): Promise<T>;
}