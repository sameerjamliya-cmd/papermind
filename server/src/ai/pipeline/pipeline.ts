import { performance } from "node:perf_hooks";
import { PipelineState } from "./pipeline-state";
import { PipelineStage } from "./pipeline-stage";
import { Logger, ConsoleLogger } from "./pipeline-logger";
import { StageExecutionError } from "./pipeline-error";

export interface StageTiming {
  readonly name: string;
  readonly durationMs: number;
  readonly aborted: boolean;
}

export interface PipelineResult<T extends PipelineState> {
  readonly state: T;
  readonly timings: readonly StageTiming[];
  readonly totalDurationMs: number;
  readonly aborted: boolean;
}

export interface PipelineOptions {
  readonly logger?: Logger;
}

export class Pipeline<T extends PipelineState = PipelineState> {
  private readonly stages: PipelineStage<T>[] = [];
  private readonly logger: Logger;

  constructor(options?: PipelineOptions) {
    this.logger = options?.logger ?? new ConsoleLogger();
  }

  /**
   * Register a stage. The pipeline executes stages in the order they are registered.
   * Returns `this` to allow chaining.
   */
  use(stage: PipelineStage<T>): this {
    this.stages.push(stage);
    return this;
  }

  /**
   * Execute the pipeline sequentially. Each stage receives the state returned by the
   * previous stage. If a stage sets `state.abort` to `true`, execution stops after
   * that stage and the partial result is returned.
   */
  async run(initialState: T): Promise<PipelineResult<T>> {
    const pipelineStartedAt = performance.now();
    let state: T = initialState;
    const timings: StageTiming[] = [];
    let aborted = false;

    this.logger.debug("pipeline:start", { stageCount: this.stages.length });

    for (const stage of this.stages) {
      const stageStartedAt = performance.now();
      const stageName = stage.name;

      this.logger.debug("stage:start", { name: stageName });

      try {
        state = await stage.execute(state);
      } catch (error) {
        this.logger.error("pipeline:error", {
          stageName,
          message: error instanceof Error ? error.message : String(error),
        });
        throw new StageExecutionError(stageName, error);
      }

      const durationMs = performance.now() - stageStartedAt;
      const didAbort = state.abort === true;

      timings.push({ name: stageName, durationMs, aborted: didAbort });
      this.logger.info("stage:complete", {
        name: stageName,
        durationMs,
        aborted: didAbort,
      });

      if (didAbort) {
        this.logger.warn("pipeline:early-exit", { stageName });
        aborted = true;
        break;
      }
    }

    const totalDurationMs = performance.now() - pipelineStartedAt;
    this.logger.info("pipeline:complete", {
      totalDurationMs,
      aborted,
      stageCount: timings.length,
    });

    return {
      state,
      timings: [...timings],
      totalDurationMs,
      aborted,
    };
  }
}