import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { audioOverviewService } from "../services/audio-overview.service";
import { workspaceIdParamSchema } from "../validator/workspace-validator";
import {
  createAudioOverviewSchema,
  audioOverviewIdParamSchema,
} from "../validator/audio-overview-validator";

export const audioOverviewController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    console.log("[audio-overview] controller.create called");
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    console.log("[audio-overview] params parsed", { workspaceId, userId });
    
    const body = createAudioOverviewSchema.parse(req.body);
    console.log("[audio-overview] body parsed", body);

    const overview = await audioOverviewService.requestOverview(
      workspaceId,
      userId,
      body.title
    );
    
    console.log("[audio-overview] SUCCESS — returning overview", overview.id);
    res.status(201).json({ data: overview });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const overviews = await audioOverviewService.listOverviews(workspaceId, userId);
    res.json({ data: overviews });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { overviewId } = audioOverviewIdParamSchema.parse(req.params);
    const overview = await audioOverviewService.getOverview(
      overviewId,
      workspaceId,
      userId
    );
    res.json({ data: overview });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { overviewId } = audioOverviewIdParamSchema.parse(req.params);
    await audioOverviewService.deleteOverview(overviewId, workspaceId, userId);
    res.status(204).send();
  }),
};
