import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { flashcardsController } from "../controllers/flashcards.controller";

export function createFlashcardsRouter(): Router {
  const router = Router({ mergeParams: true });

  router.use(requireAuth);

  router.post("/generate", flashcardsController.generate);
  router.get("/", flashcardsController.list);
  router.get("/:flashcardsId", flashcardsController.getById);
  router.delete("/:flashcardsId", flashcardsController.remove);

  return router;
}