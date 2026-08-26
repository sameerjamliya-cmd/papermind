import { z } from "zod";

export const createAudioOverviewSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const audioOverviewIdParamSchema = z.object({
  overviewId: z.string().uuid(),
});

export type CreateAudioOverviewInput = z.infer<typeof createAudioOverviewSchema>;
