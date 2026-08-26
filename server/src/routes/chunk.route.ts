import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { chunkController } from "../controllers/chunk.controller";

export const chunkRouter = Router({ mergeParams: true });

chunkRouter.use(requireAuth);

chunkRouter.get("/", chunkController.list);
