import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { collectionService } from "../services/collection.service";
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionIdParamSchema,
  collectionSourceSchema,
} from "../validator/collection-validator";

export const collectionController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const body = createCollectionSchema.parse(req.body);
    const collection = await collectionService.create(userId, body);
    res.status(201).json({ data: collection });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const collections = await collectionService.list(userId);
    res.json({ data: collections });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { collectionId } = collectionIdParamSchema.parse(req.params);
    const collection = await collectionService.getById(collectionId, userId);
    res.json({ data: collection });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { collectionId } = collectionIdParamSchema.parse(req.params);
    const body = updateCollectionSchema.parse(req.body);
    const collection = await collectionService.update(collectionId, userId, body);
    res.json({ data: collection });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { collectionId } = collectionIdParamSchema.parse(req.params);
    await collectionService.remove(collectionId, userId);
    res.status(204).send();
  }),

  addSource: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { collectionId } = collectionIdParamSchema.parse(req.params);
    const { sourceId } = collectionSourceSchema.parse(req.body);
    await collectionService.addSource(collectionId, sourceId, userId);
    res.json({ data: { sourceId, collectionId } });
  }),

  removeSource: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { collectionId, sourceId } = collectionIdParamSchema.extend({
      sourceId: z.string().uuid(),
    }).parse(req.params);
    await collectionService.removeSource(collectionId, sourceId, userId);
    res.status(204).send();
  }),
};
