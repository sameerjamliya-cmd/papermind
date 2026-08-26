export class PipelineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PipelineError";
  }
}

export class StageExecutionError extends PipelineError {
  public readonly stageName: string;
  public readonly cause: unknown;

  constructor(stageName: string, cause: unknown) {
    super(
      `Stage "${stageName}" failed: ${StageExecutionError.extractMessage(cause)}`
    );
    this.name = "StageExecutionError";
    this.stageName = stageName;
    this.cause = cause;
  }

  private static extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}