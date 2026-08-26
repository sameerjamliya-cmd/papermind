import { describe, it, expect, vi } from "vitest";
import { MemoryStage } from "./memory-stage";
import { MessageRole } from "../../../domain/enums/message-role";
import {
  createConversationId,
  createUserId,
  createWorkspaceId,
} from "../../../domain/primitives/brand";
import type { MessageRepository } from "../../../application/ports/message-repository";
import type { ChatState } from "../types/chat-state";

function makeState(): ChatState {
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
  };
}

describe("MemoryStage", () => {
  it("loads history and persists the user message", async () => {
    const history = [
      {
        id: "msg-1" as any,
        conversationId: createConversationId("conv-1"),
        workspaceId: createWorkspaceId("ws-1"),
        userId: createUserId("user-1"),
        role: MessageRole.Assistant,
        content: "Hi",
        citations: [],
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];

    const messageRepository: MessageRepository = {
      findByWorkspace: vi.fn().mockResolvedValue(history),
      findByWorkspaceAfterId: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(async (input) => ({
        id: "msg-new" as any,
        conversationId: createConversationId("conv-1"),
        workspaceId: input.workspaceId,
        userId: createUserId(input.userId),
        role: MessageRole.User,
        content: input.content,
        citations: [],
        createdAt: "2024-01-01T00:00:00Z",
      })),
    };

    const memoryStore = {
      save: vi.fn().mockResolvedValue(undefined),
      getLatest: vi.fn().mockResolvedValue(null),
    };

    const stage = new MemoryStage(messageRepository, memoryStore, 10);
    const result = await stage.execute(makeState());

    expect(messageRepository.findByWorkspace).toHaveBeenCalledWith(
      createWorkspaceId("ws-1"),
      10
    );
    expect(messageRepository.create).toHaveBeenCalledWith({
      workspaceId: createWorkspaceId("ws-1"),
      userId: "user-1",
      role: MessageRole.User,
      content: "Hello",
    });
    expect(result.history).toEqual(history);
  });
});