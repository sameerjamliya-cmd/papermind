import { z } from "zod";

export const listChunksQuerySchema = z.object({
  sourceId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListChunksQuery = z.infer<typeof listChunksQuerySchema>;
