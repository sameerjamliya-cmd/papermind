import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { workspaceService } from "../services/workspace.service";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdParamSchema,
  listWorkspacesQuerySchema,
} from "../validator/workspace-validator";

export const workspaceController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const body = createWorkspaceSchema.parse(req.body);
    const workspace = await workspaceService.create(userId, body);
    res.status(201).json({ data: workspace });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query = listWorkspacesQuerySchema.parse(req.query);
    const result = await workspaceService.list(userId, query);
    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const workspace = await workspaceService.getById(workspaceId, userId);
    res.json({ data: workspace });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const body = updateWorkspaceSchema.parse(req.body);
    const workspace = await workspaceService.update(workspaceId, userId, body);
    res.json({ data: workspace });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    await workspaceService.remove(workspaceId, userId);
    res.status(204).send();
  }),

  toggleFavorite: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const workspace = await workspaceService.toggleFavorite(workspaceId, userId);
    res.json({ data: workspace });
  }),

  listRecent: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const workspaces = await workspaceService.getRecent(userId);
    res.json({ data: workspaces });
  }),

  listFavorites: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const workspaces = await workspaceService.getFavorites(userId);
    res.json({ data: workspaces });
  }),

  listShared: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shared = await workspaceService.getShared(userId);
    res.json({ data: shared });
  }),
};
