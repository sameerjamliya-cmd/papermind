import { inngest } from "../../inngest/client";
import type { EventPublisher } from "../../application/ports/event-publisher";

export class InngestEventPublisher implements EventPublisher {
  async publish(event: {
    readonly name: string;
    readonly data: Record<string, unknown>;
  }): Promise<void> {
    await inngest.send({ name: event.name, data: event.data });
  }
}