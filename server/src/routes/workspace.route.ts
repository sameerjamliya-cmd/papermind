import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { workspaceController } from "../controllers/workspace.controller";

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth);

workspaceRouter.get("/recent", workspaceController.listRecent);
workspaceRouter.get("/favorites", workspaceController.listFavorites);
workspaceRouter.get("/shared", workspaceController.listShared);
workspaceRouter.post("/", workspaceController.create);
workspaceRouter.get("/", workspaceController.list);
workspaceRouter.get("/:workspaceId", workspaceController.getById);
workspaceRouter.patch("/:workspaceId", workspaceController.update);
workspaceRouter.delete("/:workspaceId", workspaceController.remove);
workspaceRouter.patch("/:workspaceId/favorite", workspaceController.toggleFavorite);
