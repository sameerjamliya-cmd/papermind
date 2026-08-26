import { z } from "zod";

const sourceTypes = ["pdf", "website", "youtube", "text", "markdown", "websearch"] as const;
const sourceStatuses = ["pending", "processing", "ready", "error"] as const;

export type SourceType = (typeof sourceTypes)[number];
export type SourceStatus = (typeof sourceStatuses)[number];

function isValidYoutubeUrl(url: string) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
}

export const addSourceWebsiteSchema = z.object({
  type: z.literal("website"),
  url: z.string().url("Invalid URL format"),
  title: z.string().min(1, "Title is required").max(500).optional(),
});

export const addSourceYoutubeSchema = z.object({
  type: z.literal("youtube"),
  url: z.string().refine(isValidYoutubeUrl, "Invalid YouTube URL"),
  title: z.string().min(1, "Title is required").max(500).optional(),
});

export const addSourceTextSchema = z.object({
  type: z.enum(["text", "markdown"]),
  title: z.string().min(1, "Title is required").max(500),
  content: z.string().min(1, "Content is required"),
});

export const addSourcePdfSchema = z.object({
  type: z.literal("pdf"),
  title: z.string().max(500).optional(),
});

export const addSourceWebSearchSchema = z.object({
  type: z.literal("websearch"),
  query: z.string().min(1, "Query is required").max(500),
  maxResults: z.coerce.number().int().min(1).max(10).default(5),
  searchDepth: z.enum(["basic", "advanced"]).default("basic"),
});

export const addSourceInputSchema = z.discriminatedUnion("type", [
  addSourceWebsiteSchema,
  addSourceYoutubeSchema,
  addSourceTextSchema,
  addSourcePdfSchema,
  addSourceWebSearchSchema,
]);

export const sourceIdSchema = z.string().uuid("Invalid source ID");

export const sourceIdParamSchema = z.object({
  sourceId: sourceIdSchema,
});

export const reprocessSourceSchema = z.object({
  sourceId: sourceIdSchema,
});

export const listSourcesQuerySchema = z.object({
  status: z.enum(sourceStatuses).optional(),
  type: z.enum(sourceTypes).optional(),
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const sourceStatusSchema = z.enum(sourceStatuses);

export const updateSourceStatusSchema = z.object({
  sourceId: sourceIdSchema,
  status: sourceStatusSchema,
});

export const deleteSourceSchema = z.object({
  sourceId: sourceIdSchema,
});

export const bulkDeleteSourcesSchema = z.object({
  sourceIds: z.array(z.string().uuid()).min(1, "At least one source ID is required"),
});

export type AddSourceInput = z.infer<typeof addSourceInputSchema>;
export type AddSourceWebsiteInput = z.infer<typeof addSourceWebsiteSchema>;
export type AddSourceYoutubeInput = z.infer<typeof addSourceYoutubeSchema>;
export type AddSourceTextInput = z.infer<typeof addSourceTextSchema>;
export type AddSourcePdfInput = z.infer<typeof addSourcePdfSchema>;
export type AddSourceWebSearchInput = z.infer<typeof addSourceWebSearchSchema>;
export type SourceIdParam = z.infer<typeof sourceIdParamSchema>;
export type ListSourcesQuery = z.infer<typeof listSourcesQuerySchema>;
export type BulkDeleteSourcesInput = z.infer<typeof bulkDeleteSourcesSchema>;
