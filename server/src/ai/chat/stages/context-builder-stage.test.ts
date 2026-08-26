import { describe, it, expect } from "vitest";
import { ContextBuilderStage } from "./context-builder-stage";
import { RetrieverType } from "../../../domain/enums/retriever-type";
import {
  createConversationId,
  createUserId,
  createWorkspaceId,
} from "../../../domain/primitives/brand";
import type { ChatState } from "../types/chat-state";

function makeState(): ChatState {
  return {
    workspaceId: createWorkspaceId("ws-1"),
    userId: createUserId("user-1"),
    conversationId: createConversationId("conv-1"),
    message: "What is this?",
    enableWebSearch: false,
    history: [],
    longTermMemory: null,
    retrievedChunks: [],
    rankedChunks: [
      {
        id: "chunk-1",
        text: "This is the first chunk.",
        sourceId: "src-1",
        sourceTitle: "Doc A",
        sourceType: "text",
        chunkIndex: 0,
        score: 0.9,
        retrieverType: RetrieverType.Vector,
      },
      {
        id: "chunk-2",
        text: "This is the second chunk.",
        sourceId: "src-2",
        sourceTitle: "Doc B",
        sourceType: "text",
        chunkIndex: 1,
        score: 0.8,
        retrieverType: RetrieverType.Vector,
      },
    ],
    contextText: "",
  };
}

describe("ContextBuilderStage", () => {
  it("concatenates ranked chunks with source titles", async () => {
    const stage = new ContextBuilderStage();
    const result = await stage.execute(makeState());

    expect(result.contextText).toContain("[Source: Doc A]");
    expect(result.contextText).toContain("This is the first chunk.");
    expect(result.contextText).toContain("[Source: Doc B]");
    expect(result.contextText).toContain("This is the second chunk.");
    expect(result.contextText).toContain("---");
  });

  it("produces empty context when no chunks are ranked", async () => {
    const stage = new ContextBuilderStage();
    const result = await stage.execute({ ...makeState(), rankedChunks: [] });

    expect(result.contextText).toBe("");
  });
});