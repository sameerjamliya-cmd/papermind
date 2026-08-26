import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { ChatState } from "../types/chat-state";
import { serializeChatEvent } from "../types/chat-events";

export class StreamingStage implements PipelineStage<ChatState> {
  readonly name = "streaming";

  async execute(state: ChatState): Promise<ChatState> {
    await state.progressWriter?.({
      type: "progress",
      stage: "streaming",
      status: "started",
    });

    if (!state.textStream) {
      await state.progressWriter?.({
        type: "progress",
        stage: "streaming",
        status: "completed",
      });
      return { ...state, response: "" };
    }

    let response = "";
    for await (const chunk of state.textStream) {
      response += chunk;
      const event = serializeChatEvent({ type: "token", delta: chunk });
      await state.streamWriter?.(`${event}\n`);
    }

    await state.progressWriter?.({
      type: "progress",
      stage: "streaming",
      status: "completed",
    });

    return { ...state, response };
  }
}