import type { Express } from "express";
import { Router } from "express";
import { workspaceRouter } from "./workspace.route";
import { sourceRouter } from "./source.route";
import { collectionRouter } from "./collection.route";
import { chunkRouter } from "./chunk.route";
import { createChatRouter } from "./chat.route";
import { createAudioOverviewRouter } from "./audio-overview.route";
import { createQuizRouter } from "./quiz.route";
import { createFlashcardsRouter } from "./flashcards.route";
import { createInfographicRouter } from "./infographic.route";
import { createKnowledgeResourceRouter } from "./knowledge-resource.route";
import { UploadKnowledgeResourceUseCase } from "../application/use-cases/upload-knowledge-resource.use-case";
import { ChatPipeline } from "../ai/chat/pipeline/chat-pipeline";
import { CloudinaryFileStorage } from "../infrastructure/storage/cloudinary-file-storage";
import { PrismaKnowledgeResourceRepository } from "../infrastructure/persistence/prisma-knowledge-resource-repository";
import { PrismaWorkspaceRepository } from "../infrastructure/persistence/prisma-workspace-repository";
import { PrismaMessageRepository } from "../infrastructure/persistence/prisma-message-repository";
import { InngestEventPublisher } from "../infrastructure/events/inngest-event-publisher";
import { TavilyWebSearcher } from "../infrastructure/search/tavily-web-searcher";
import { mem0MemoryStore } from "../ai/memory/mem0-client";
import { sourceController } from "../controllers/source.controller";
import { createAudioAskRouter } from "../controllers/audio-overview-ask.controller";

export function registerRoutes(app: Express) {
  const fileStorage = new CloudinaryFileStorage();
  const knowledgeResourceRepository = new PrismaKnowledgeResourceRepository();
  const workspaceRepository = new PrismaWorkspaceRepository();
  const eventPublisher = new InngestEventPublisher();
  const messageRepository = new PrismaMessageRepository();
  const webSearcher = new TavilyWebSearcher();

  const uploadKnowledgeResourceUseCase = new UploadKnowledgeResourceUseCase(
    fileStorage,
    knowledgeResourceRepository,
    workspaceRepository,
    eventPublisher
  );

  const chatPipeline = new ChatPipeline({
    messageRepository,
    webSearcher,
    memoryStore: mem0MemoryStore,
  });

  app.use("/api/workspaces", workspaceRouter);
  app.use("/api/collections", collectionRouter);
  app.use("/api/sources", Router().get("/", sourceController.listAll));
  app.use(
    "/api/workspaces/:workspaceId/knowledge-resources",
    createKnowledgeResourceRouter(uploadKnowledgeResourceUseCase)
  );
  app.use("/api/workspaces/:workspaceId/sources", sourceRouter);
  app.use("/api/workspaces/:workspaceId/chunks", chunkRouter);
  app.use("/api/workspaces/:workspaceId/chat", createChatRouter(chatPipeline));
  app.use(
    "/api/workspaces/:workspaceId/audio-overview",
    createAudioOverviewRouter(chatPipeline)
  );
  app.use("/api/workspaces/:workspaceId/quiz", createQuizRouter());
  app.use(
    "/api/workspaces/:workspaceId/flashcards",
    createFlashcardsRouter()
  );
  app.use(
    "/api/workspaces/:workspaceId/infographics",
    createInfographicRouter()
  );
}