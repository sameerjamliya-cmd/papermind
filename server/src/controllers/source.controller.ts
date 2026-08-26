import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { sourceService } from "../ai/ingestion/source.service";
import {
  addSourceInputSchema,
  sourceIdParamSchema,
  listSourcesQuerySchema,
  bulkDeleteSourcesSchema,
} from "../validator/source-validator";
import { workspaceIdParamSchema } from "../validator/workspace-validator";
import { z } from "zod";

const allSourcesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
});

export const sourceController = {
  add: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const body = addSourceInputSchema.parse(req.body);
    const file = req.file;
    const source = await sourceService.addSource(workspaceId, userId, body, file);
    res.status(201).json({ data: source });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const query = listSourcesQuerySchema.parse(req.query);
    const result = await sourceService.listSources(workspaceId, userId, query);
    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { sourceId } = sourceIdParamSchema.parse(req.params);
    const source = await sourceService.getSource(workspaceId, sourceId, userId);
    res.json({ data: source });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { sourceId } = sourceIdParamSchema.parse(req.params);
    const source = await sourceService.updateSource(
      workspaceId,
      sourceId,
      userId,
      req.body
    );
    res.json({ data: source });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { sourceId } = sourceIdParamSchema.parse(req.params);
    await sourceService.deleteSource(workspaceId, sourceId, userId);
    res.status(204).send();
  }),

  bulkRemove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const body = bulkDeleteSourcesSchema.parse(req.body);
    const result = await sourceService.bulkDelete(workspaceId, userId, body);
    res.json(result);
  }),

  listAll: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query = allSourcesQuerySchema.parse(req.query);
    const result = await sourceService.listAllSourcesByUser(userId, query);
    res.json(result);
  }),
};
