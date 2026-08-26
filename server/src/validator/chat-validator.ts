import { z } from "zod";

export const sendMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000),
  enableWebSearch: z.boolean().default(false),
});

export const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});