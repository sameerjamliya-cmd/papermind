export interface PipelineState {
  /**
   * Stages may set this to `true` to halt the pipeline after the current stage.
   * The state returned by the aborting stage is included in the final result.
   */
  readonly abort?: boolean;
}