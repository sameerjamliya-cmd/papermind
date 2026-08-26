import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(2).optional(),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(2).optional(),
  order: z.number().int().min(0).optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export const collectionIdParamSchema = z.object({
  collectionId: z.string().uuid(),
});

export const collectionSourceSchema = z.object({
  sourceId: z.string().uuid(),
});
