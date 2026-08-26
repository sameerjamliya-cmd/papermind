import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { ChatState } from "../types/chat-state";
import { withProgress } from "./stage-utils";

export class ContextBuilderStage implements PipelineStage<ChatState> {
  readonly name = "context-builder";

  async execute(state: ChatState): Promise<ChatState> {
    return withProgress(state, "context-builder", async () => {
      const contextText = state.rankedChunks
        .map((chunk) => `[Source: ${chunk.sourceTitle}] ${chunk.text}`)
        .join("\n\n---\n\n");

      return { ...state, contextText };
    });
  }
}