import { prisma } from "../../lib/db";
import type { WorkspaceRepository } from "../../application/ports/workspace-repository";
import type { Workspace } from "../../domain";
import { createWorkspaceId, createUserId } from "../../domain/primitives/brand";

export class PrismaWorkspaceRepository implements WorkspaceRepository {
  async findById(id: string): Promise<Workspace | null> {
    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return null;

    return {
      id: createWorkspaceId(workspace.id),
      userId: createUserId(workspace.userId),
      title: workspace.title,
      description: workspace.description ?? null,
      icon: workspace.icon ?? null,
      chatModel: workspace.chatModel,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }
}