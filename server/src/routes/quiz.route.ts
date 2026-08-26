import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { quizController } from "../controllers/quiz.controller";

export function createQuizRouter(): Router {
  const router = Router({ mergeParams: true });

  router.use(requireAuth);

  router.post("/generate", quizController.generate);
  router.get("/:quizId", quizController.getById);
  router.post("/:quizId/grade", quizController.grade);

  return router;
}
