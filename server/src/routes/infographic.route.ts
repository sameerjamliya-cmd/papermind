import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { infographicController } from "../controllers/infographic.controller";

export function createInfographicRouter(): Router {
  const router = Router({ mergeParams: true });

  router.use(requireAuth);

  router.post("/", infographicController.create);
  router.get("/", infographicController.list);
  router.get("/:infographicId", infographicController.getById);
  router.delete("/:infographicId", infographicController.remove);

  return router;
}