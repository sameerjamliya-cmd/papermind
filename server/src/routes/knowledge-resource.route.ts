import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { createKnowledgeResourceController } from "../controllers/knowledge-resource.controller";
import type { UploadKnowledgeResourceUseCase } from "../application/use-cases/upload-knowledge-resource.use-case";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export function createKnowledgeResourceRouter(
  uploadUseCase: UploadKnowledgeResourceUseCase
): Router {
  const controller = createKnowledgeResourceController(uploadUseCase);
  const router = Router({ mergeParams: true });

  router.use(requireAuth);
  router.post("/", upload.single("file"), controller.upload);

  return router;
}