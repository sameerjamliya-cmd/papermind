import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { workspaceIdParamSchema } from "../../validator/workspace-validator";
import {
  sendMessageSchema,
  messagesQuerySchema,
} from "../../validator/chat-validator";
import type { ChatPipeline } from "../chat/pipeline/chat-pipeline";
import {
  createWorkspaceId,
  createUserId,
  createConversationId,
} from "../../domain/primitives/brand";
import { MessageRole } from "../../domain/enums/message-role";
import { messageRepository } from "../../repository/message.repository";
import { workspaceRepository } from "../../repository/workspace.repository";
import { NotFoundError, ForbiddenError } from "../../types/app-error";
import { PrismaMemorySyncRepository } from "../../infrastructure/persistence/prisma-memory-sync-repository";
import { inngest } from "../../inngest/client";
import { getEnv } from "../../config/env";
import {
  serializeChatEvent,
  type ChatEvent,
} from "../chat/types/chat-events";

async function assertOwnedWorkspace(workspaceId: string, userId: string) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found");
  if (workspace.userId !== userId) throw new ForbiddenError();
}

export function createChatController(chatPipeline: ChatPipeline) {
  return {
    send: asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.id;
      const { workspaceId } = workspaceIdParamSchema.parse(req.params);
      const { message, enableWebSearch } = sendMessageSchema.parse(req.body);

      await assertOwnedWorkspace(workspaceId, userId);

      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");

      let fullResponse = "";

      const streamWriter = (chunk: string) => {
        res.write(chunk);
      };

      const progressWriter = (event: ChatEvent) => {
        res.write(`${serializeChatEvent(event)}\n`);
      };

      const result = await chatPipeline.run({
        workspaceId: createWorkspaceId(workspaceId),
        userId: createUserId(userId),
        conversationId: createConversationId(workspaceId),
        message,
        enableWebSearch,
        progressWriter,
        streamWriter,
        history: [],
        longTermMemory: null,
        retrievedChunks: [],
        rankedChunks: [],
        contextText: "",
      });

      if (result.state.response) {
        await messageRepository.create({
          workspaceId,
          userId,
          role: MessageRole.Assistant,
          content: result.state.response,
        });
      }

      const memorySyncRepository = new PrismaMemorySyncRepository();
      await memorySyncRepository.increment(userId, workspaceId);
      const checkpoint = await memorySyncRepository.find(userId, workspaceId);

      if (checkpoint && checkpoint.messageCountSinceSync >= getEnv().MEMORY_SYNC_MESSAGE_THRESHOLD) {
        await inngest.send({
          name: "conversation.memory.sync",
          data: { userId, workspaceId },
        });
      }

      res.end();
    }),

    list: asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.id;
      const { workspaceId } = workspaceIdParamSchema.parse(req.params);
      const { limit } = messagesQuerySchema.parse(req.query);

      await assertOwnedWorkspace(workspaceId, userId);

      const messages = await messageRepository.findByWorkspace(
        workspaceId,
        limit
      );

      res.json({ data: messages });
    }),
  };
}