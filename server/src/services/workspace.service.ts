import { NotFoundError, ForbiddenError } from "../types/app-error";
import { workspaceRepository } from "../repository/workspace.repository";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  ListWorkspacesQuery,
} from "../validator/workspace-validator";

async function getOwned(workspaceId: string, userId: string) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundError("Workspace not found");
  }
  if (workspace.userId !== userId) {
    throw new ForbiddenError();
  }
  return workspace;
}

export const workspaceService = {
  create(userId: string, input: CreateWorkspaceInput) {
    return workspaceRepository.create(userId, input);
  },

  async list(userId: string, query: ListWorkspacesQuery) {
    const { workspaces, total } = await workspaceRepository.findAllByUser(userId, query);
    const { page, limit } = query;
    return {
      data: workspaces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(workspaceId: string, userId: string) {
    return getOwned(workspaceId, userId);
  },

  async update(workspaceId: string, userId: string, input: UpdateWorkspaceInput) {
    await getOwned(workspaceId, userId);
    return workspaceRepository.update(workspaceId, input);
  },

  async remove(workspaceId: string, userId: string) {
    await getOwned(workspaceId, userId);
    return workspaceRepository.delete(workspaceId);
  },

  async toggleFavorite(workspaceId: string, userId: string) {
    const workspace = await getOwned(workspaceId, userId);
    return workspaceRepository.toggleFavorite(workspaceId, !workspace.isFavorite);
  },

  getRecent(userId: string, limit?: number) {
    return workspaceRepository.findRecentByUser(userId, limit);
  },

  getFavorites(userId: string) {
    return workspaceRepository.findFavoritesByUser(userId);
  },

  getShared(userId: string) {
    return workspaceRepository.findSharedWithUser(userId);
  },
};
