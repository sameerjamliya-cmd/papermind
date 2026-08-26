import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  cardCount: z.number().int().min(5).max(40),
});

export const flashcardsIdParamSchema = z.object({
  flashcardsId: z.string().uuid(),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;