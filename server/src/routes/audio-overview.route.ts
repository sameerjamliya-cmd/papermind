import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { audioOverviewController } from "../controllers/audio-overview.controller";
import { createAudioAskRouter } from "../controllers/audio-overview-ask.controller";
import type { ChatPipeline } from "../ai/chat/pipeline/chat-pipeline";

export function createAudioOverviewRouter(chatPipeline: ChatPipeline): Router {
  const router = Router({ mergeParams: true });

  router.use(requireAuth);

  router.post("/", audioOverviewController.create);
  router.get("/", audioOverviewController.list);
  router.get("/:overviewId", audioOverviewController.getById);
  router.delete("/:overviewId", audioOverviewController.remove);
  router.post("/:overviewId/ask", createAudioAskRouter(chatPipeline));

  return router;
}
