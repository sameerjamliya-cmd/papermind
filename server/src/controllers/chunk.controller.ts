import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { chunkService } from "../ai/retrieval/chunk.service";
import { workspaceIdParamSchema } from "../validator/workspace-validator";
import { listChunksQuerySchema } from "../validator/chunk-validator";

export const chunkController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const query = listChunksQuerySchema.parse(req.query);
    const result = await chunkService.listChunks(workspaceId, userId, query);
    res.json(result);
  }),
};
