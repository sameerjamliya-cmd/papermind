import { prisma } from "../lib/db";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  ListWorkspacesQuery,
} from "../validator/workspace-validator";

export const workspaceRepository = {
  create(userId: string, data: CreateWorkspaceInput) {
    return prisma.workspace.create({
      data: { ...data, userId },
    });
  },

  findById(id: string) {
    return prisma.workspace.findUnique({
      where: { id },
    });
  },

  async findAllByUser(userId: string, query: ListWorkspacesQuery) {
    const { page, limit, search } = query;

    const where: Record<string, unknown> = { userId };
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.workspace.count({ where }),
    ]);

    return { workspaces, total };
  },

  update(id: string, data: UpdateWorkspaceInput) {
    return prisma.workspace.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.workspace.delete({
      where: { id },
    });
  },

  toggleFavorite(id: string, isFavorite: boolean) {
    return prisma.workspace.update({
      where: { id },
      data: { isFavorite },
    });
  },

  findRecentByUser(userId: string, limit = 5) {
    return prisma.workspace.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  },

  findFavoritesByUser(userId: string) {
    return prisma.workspace.findMany({
      where: { userId, isFavorite: true },
      orderBy: { updatedAt: "desc" },
    });
  },

  findSharedWithUser(userId: string) {
    return prisma.sharedWorkspace.findMany({
      where: { sharedWithId: userId },
      include: { workspace: true },
      orderBy: { createdAt: "desc" },
    });
  },
};
