import { describe, it, expect, vi } from "vitest";
import { StreamingStage } from "./streaming-stage";
import {
  createConversationId,
  createUserId,
  createWorkspaceId,
} from "../../../domain/primitives/brand";
import type { ChatState } from "../types/chat-state";
import type { ChatEvent } from "../types/chat-events";

function makeState(
  stream?: AsyncIterable<string>,
  writer?: (chunk: string) => void | Promise<void>,
  progressWriter?: (event: ChatEvent) => void | Promise<void>
): ChatState {
  return {
    workspaceId: createWorkspaceId("ws-1"),
    userId: createUserId("user-1"),
    conversationId: createConversationId("conv-1"),
    message: "Hello",
    enableWebSearch: false,
    history: [],
    longTermMemory: null,
    retrievedChunks: [],
    rankedChunks: [],
    contextText: "",
    textStream: stream,
    streamWriter: writer,
    progressWriter,
  };
}

async function* makeStream(): AsyncIterable<string> {
  yield "Hello, ";
  yield "world!";
}

describe("StreamingStage", () => {
  it("emits progress started/completed and token events as NDJSON", async () => {
    const writer = vi.fn();
    const progressWriter = vi.fn();
    const stage = new StreamingStage();
    const result = await stage.execute(
      makeState(makeStream(), writer, progressWriter)
    );

    expect(result.response).toBe("Hello, world!");

    expect(progressWriter).toHaveBeenCalledTimes(2);
    expect(progressWriter).toHaveBeenNthCalledWith(1, {
      type: "progress",
      stage: "streaming",
      status: "started",
    });
    expect(progressWriter).toHaveBeenNthCalledWith(2, {
      type: "progress",
      stage: "streaming",
      status: "completed",
    });

    expect(writer).toHaveBeenCalledTimes(2);
    expect(writer).toHaveBeenNthCalledWith(
      1,
      '{"type":"token","delta":"Hello, "}\n'
    );
    expect(writer).toHaveBeenNthCalledWith(
      2,
      '{"type":"token","delta":"world!"}\n'
    );
  });

  it("returns empty response and emits completed when no stream is present", async () => {
    const progressWriter = vi.fn();
    const stage = new StreamingStage();
    const result = await stage.execute(makeState(undefined, undefined, progressWriter));

    expect(result.response).toBe("");
    expect(progressWriter).toHaveBeenCalledTimes(2);
    expect(progressWriter).toHaveBeenNthCalledWith(1, {
      type: "progress",
      stage: "streaming",
      status: "started",
    });
    expect(progressWriter).toHaveBeenNthCalledWith(2, {
      type: "progress",
      stage: "streaming",
      status: "completed",
    });
  });
});