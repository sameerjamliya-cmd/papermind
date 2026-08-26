import { inngest } from "../client";
import { type InngestFunction } from "inngest";
import { getEnv } from "../../config/env";
import { PrismaMessageRepository } from "../../infrastructure/persistence/prisma-message-repository";
import { PrismaMemorySyncRepository } from "../../infrastructure/persistence/prisma-memory-sync-repository";
import { mem0MemoryStore } from "../../ai/memory/mem0-client";
import { summarizeConversation } from "../../ai/memory/memory-summarizer";
import { formatMemory } from "../../ai/memory/memory-formatter";
import { createWorkspaceId } from "../../domain/primitives/brand";

const messageRepository = new PrismaMessageRepository();
const memorySyncRepository = new PrismaMemorySyncRepository();

export const syncConversationMemory: InngestFunction.Any = inngest.createFunction(
  {
    id: "sync-conversation-memory",
    name: "Sync Conversation Memory",
    retries: 2,
    triggers: [{ event: "conversation.memory.sync" }],
  },
  async ({ event, step }) => {
    const { workspaceId, userId } = event.data as {
      workspaceId: string;
      userId: string;
    };

    const env = getEnv();
    const windowSize = env.MEMORY_SUMMARY_MESSAGE_WINDOW;

    const checkpoint = await step.run("fetch-checkpoint", () =>
      memorySyncRepository.find(userId, workspaceId)
    );

    const messages = await step.run("fetch-unsynced-messages", () =>
      messageRepository.findByWorkspaceAfterId(
        createWorkspaceId(workspaceId),
        checkpoint?.lastSyncedMessageId ?? null,
        windowSize
      )
    );

    if (messages.length === 0) {
      return { saved: false, reason: "no-new-messages" };
    }

    const profile = await step.run("summarize-conversation", () =>
      summarizeConversation(messages)
    );

    const memoryText = formatMemory(profile);
    if (!memoryText.trim()) {
      return { saved: false, reason: "empty-summary" };
    }

    await step.run("save-memory", () =>
      mem0MemoryStore.save(userId, memoryText, {
        workspaceId,
        messageCount: messages.length,
        summarizedAt: new Date().toISOString(),
      })
    );

    const lastMessage = messages[messages.length - 1];

    await step.run("update-checkpoint", () =>
      memorySyncRepository.markSynced(userId, workspaceId, lastMessage.id)
    );

    return {
      saved: true,
      messageCount: messages.length,
      lastSyncedMessageId: lastMessage.id,
    };
  }
);
