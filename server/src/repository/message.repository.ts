import { prisma } from "../lib/db";

export const messageRepository = {
  create(data: {
    workspaceId: string;
    userId: string;
    role: string;
    content: string;
    citations?: unknown;
  }) {
    return prisma.message.create({ data: data as any });
  },

  findByWorkspace(workspaceId: string, limit = 50) {
    return prisma.message.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  },
};
