import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { flashcardsService } from "../services/flashcards.service";
import { workspaceIdParamSchema } from "../validator/workspace-validator";
import {
  generateFlashcardsSchema,
  flashcardsIdParamSchema,
} from "../validator/flashcards-validator";

export const flashcardsController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const body = generateFlashcardsSchema.parse(req.body);

    const deck = await flashcardsService.requestDeck(workspaceId, userId, body);
    res.status(201).json({ data: deck });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { flashcardsId } = flashcardsIdParamSchema.parse(req.params);

    const deck = await flashcardsService.getDeck(flashcardsId, workspaceId, userId);
    res.json({ data: deck });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);

    const decks = await flashcardsService.listDecks(workspaceId, userId);
    res.json({ data: decks });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { flashcardsId } = flashcardsIdParamSchema.parse(req.params);

    await flashcardsService.deleteDeck(flashcardsId, workspaceId, userId);
    res.status(204).end();
  }),
};