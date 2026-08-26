import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { infographicService } from "../services/infographic.service";
import { workspaceIdParamSchema } from "../validator/workspace-validator";
import {
  generateInfographicSchema,
  infographicIdParamSchema,
} from "../validator/infographic-validator";

export const infographicController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const body = generateInfographicSchema.parse(req.body);

    const infographic = await infographicService.requestInfographic(
      workspaceId,
      userId,
      body
    );
    res.status(201).json({ data: infographic });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { infographicId } = infographicIdParamSchema.parse(req.params);

    const infographic = await infographicService.getInfographic(
      infographicId,
      workspaceId,
      userId
    );
    res.json({ data: infographic });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);

    const infographics = await infographicService.listInfographics(
      workspaceId,
      userId
    );
    res.json({ data: infographics });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { infographicId } = infographicIdParamSchema.parse(req.params);

    await infographicService.deleteInfographic(
      infographicId,
      workspaceId,
      userId
    );
    res.status(204).end();
  }),
};