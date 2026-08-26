import { NotFoundError, ForbiddenError } from "../../types/app-error";
import { chunkRepository } from "../../repository/chunk.repository";
import { workspaceRepository } from "../../repository/workspace.repository";

async function getOwnedWorkspace(workspaceId: string, userId: string) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found");
  if (workspace.userId !== userId) throw new ForbiddenError();
  return workspace;
}

export const chunkService = {
  async listChunks(
    workspaceId: string,
    userId: string,
    options: { page?: number; limit?: number; sourceId?: string } = {}
  ) {
    await getOwnedWorkspace(workspaceId, userId);
    const { page = 1, limit = 50, sourceId } = options;
    const { chunks, total } = await chunkRepository.findAllByWorkspace(
      workspaceId,
      page,
      limit,
      sourceId
    );

    return {
      data: chunks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
};