import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { ChatState } from "../types/chat-state";
import { withProgress } from "./stage-utils";

export class GenerationStage implements PipelineStage<ChatState> {
  readonly name = "generation";

  async execute(state: ChatState): Promise<ChatState> {
    return withProgress(state, "generation", async () => {
      const historyText = state.history
        .slice(-10)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const memorySection = state.longTermMemory
        ? `LONG-TERM MEMORY ABOUT THE USER:\n${state.longTermMemory}\n`
        : "";

      const { textStream } = streamText({
        model: openai("gpt-4o"),
        system: `You are a helpful research assistant. Answer the user's question using ONLY the provided context below.
Cite sources inline using [Source: name] notation.

${memorySection}CONTEXT:
${state.contextText}

${historyText ? `PREVIOUS CONVERSATION:\n${historyText}` : ""}`,
        prompt: state.message,
        temperature: 0.3,
      });

      return { ...state, textStream };
    });
  }
}