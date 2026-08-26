import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { collectionController } from "../controllers/collection.controller";

export const collectionRouter = Router();

collectionRouter.use(requireAuth);

collectionRouter.post("/", collectionController.create);
collectionRouter.get("/", collectionController.list);
collectionRouter.get("/:collectionId", collectionController.getById);
collectionRouter.patch("/:collectionId", collectionController.update);
collectionRouter.delete("/:collectionId", collectionController.remove);
collectionRouter.post("/:collectionId/sources", collectionController.addSource);
collectionRouter.delete("/:collectionId/sources/:sourceId", collectionController.removeSource);
