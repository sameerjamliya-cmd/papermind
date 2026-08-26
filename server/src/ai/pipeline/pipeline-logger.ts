export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

export class ConsoleLogger implements Logger {
  info(message: string, context?: Record<string, unknown>): void {
    console.log(this.format("info", message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(this.format("warn", message, context));
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(this.format("error", message, context));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    console.log(this.format("debug", message, context));
  }

  private format(
    level: string,
    message: string,
    context?: Record<string, unknown>
  ): string {
    const entry = { level, message, ...context };
    try {
      return JSON.stringify(entry);
    } catch {
      return JSON.stringify({
        level,
        message,
        contextSerializationFailed: true,
      });
    }
  }
}

export class NoopLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
  debug(): void {}
}