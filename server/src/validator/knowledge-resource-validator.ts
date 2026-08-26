import { z } from "zod";

export const uploadKnowledgeResourceSchema = z.object({
  title: z.string().min(1).max(500).optional(),
});

export type UploadKnowledgeResourceBody = z.infer<
  typeof uploadKnowledgeResourceSchema
>;