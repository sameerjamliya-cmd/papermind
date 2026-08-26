import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createChatController } from "../ai/orchestrator/chat.controller";
import type { ChatPipeline } from "../ai/chat/pipeline/chat-pipeline";

export function createChatRouter(chatPipeline: ChatPipeline): Router {
  const controller = createChatController(chatPipeline);
  const router = Router({ mergeParams: true });

  router.use(requireAuth);
  router.post("/", controller.send);
  router.get("/", controller.list);

  return router;
}