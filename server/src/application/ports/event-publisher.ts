export interface EventPublisher {
  publish(event: {
    readonly name: string;
    readonly data: Record<string, unknown>;
  }): Promise<void>;
}