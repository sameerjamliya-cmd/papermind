import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { workspaceIdParamSchema } from "../validator/workspace-validator";
import { audioOverviewIdParamSchema } from "../validator/audio-overview-validator";
import { audioSegmentRepository } from "../repository/audio-segment.repository";
import { audioOverviewRepository } from "../repository/audio-overview.repository";
import { chunkRepository } from "../repository/chunk.repository";
import { sourceRepository } from "../repository/source.repository";
import type { ChatPipeline } from "../ai/chat/pipeline/chat-pipeline";
import {
  createWorkspaceId,
  createUserId,
  createConversationId,
} from "../domain/primitives/brand";
import { MessageRole } from "../domain/enums/message-role";
import { messageRepository } from "../repository/message.repository";
import {
  serializeChatEvent,
  type ChatEvent,
} from "../ai/chat/types/chat-events";
import { ForbiddenError, NotFoundError } from "../types/app-error";

const askSchema = z.object({
  question: z.string().min(1).max(2000),
  segmentId: z.string().uuid().optional(),
});

export function createAudioAskRouter(chatPipeline: ChatPipeline) {
  return asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { overviewId } = audioOverviewIdParamSchema.parse(req.params);
    const { question, segmentId } = askSchema.parse(req.body);

    const overview = await audioOverviewRepository.findById(overviewId);
    if (!overview) throw new NotFoundError("Audio overview not found");
    if (overview.workspaceId !== workspaceId) throw new ForbiddenError();

    let segmentContext = "";
    let sourceContext = "";

    if (segmentId) {
      const segment = await audioSegmentRepository.findById(segmentId);
      if (segment && segment.audioOverviewId === overviewId) {
        segmentContext = `\n\nCURRENT AUDIO SEGMENT (${segment.speaker}): "${segment.text}"`;

        const refs = segment.sourceRefs as Array<{
          chunkId: string;
          sourceId: string;
          sourceTitle: string;
          snippet: string;
        }> | null;

        if (refs && refs.length > 0) {
          const sourceIds = [...new Set(refs.map((r) => r.sourceId))];
          const sources = await Promise.all(
            sourceIds.map((id) => sourceRepository.findById(id))
          );
          const sourceTitles = new Map<string, string>();
          for (const s of sources) {
            if (s) sourceTitles.set(s.id, s.title);
          }

          const chunkTexts = await Promise.all(
            refs.map((r) => chunkRepository.findById(r.chunkId))
          );

          sourceContext = "\n\nRELEVANT SOURCE CHUNKS:\n" +
            chunkTexts
              .filter(Boolean)
              .map(
                (c) =>
                  `[Source: ${sourceTitles.get(c!.sourceId) ?? "Unknown"}] ${c!.text}`
              )
              .join("\n\n");
        }
      }
    }

    const enhancedQuestion = `${question}${segmentContext}${sourceContext}`;

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    const streamWriter = (chunk: string) => {
      res.write(chunk);
    };
    const progressWriter = (event: ChatEvent) => {
      res.write(`${serializeChatEvent(event)}\n`);
    };

    const result = await chatPipeline.run({
      workspaceId: createWorkspaceId(workspaceId),
      userId: createUserId(userId),
      conversationId: createConversationId(`audio-${overviewId}`),
      message: enhancedQuestion,
      enableWebSearch: false,
      progressWriter,
      streamWriter,
      history: [],
      longTermMemory: null,
      retrievedChunks: [],
      rankedChunks: [],
      contextText: sourceContext,
    });

    if (result.state.response) {
      await messageRepository.create({
        workspaceId,
        userId,
        role: MessageRole.Assistant,
        content: result.state.response,
      });
    }

    res.end();
  });
}
