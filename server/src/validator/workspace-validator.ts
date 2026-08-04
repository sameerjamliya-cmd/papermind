import { z } from "zod";

const chatModels = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"] as const;

const iconSchema = z.string().emoji("Icon must be a single emoji").or(
  z.string().regex(/^[a-z]+(-[a-z]+)*$/, "Invalid icon name")
);

export const createWorkspaceSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  chatModel: z.enum(chatModels).default("gpt-4o-mini"),
  icon: iconSchema.optional(),
});

export const updateWorkspaceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  chatModel: z.enum(chatModels).optional(),
  icon: iconSchema.optional(),
});

export const workspaceIdSchema = z.string().uuid("Invalid workspace ID");

export const workspaceIdParamSchema = z.object({
  workspaceId: workspaceIdSchema,
});

export const deleteWorkspaceSchema = z.object({
  workspaceId: workspaceIdSchema,
});

export const listWorkspacesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
});

export type ChatModel = z.infer<typeof createWorkspaceSchema.shape.chatModel>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type WorkspaceIdParam = z.infer<typeof workspaceIdParamSchema>;
export type ListWorkspacesQuery = z.infer<typeof listWorkspacesQuerySchema>;
