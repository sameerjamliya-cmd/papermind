import { prisma } from "../lib/db";

export const audioOverviewRepository = {
  create(data: {
    workspaceId: string;
    userId: string;
    title: string;
  }) {
    return prisma.audioOverview.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        title: data.title,
        status: "generating",
      },
    });
  },

  findById(id: string) {
    return prisma.audioOverview.findUnique({
      where: { id },
      include: { segments: { orderBy: { order: "asc" } } },
    });
  },

  findAllByWorkspace(workspaceId: string) {
    return prisma.audioOverview.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: { segments: { orderBy: { order: "asc" } } },
    });
  },

  findActiveByWorkspace(workspaceId: string) {
    return prisma.audioOverview.findFirst({
      where: {
        workspaceId,
        status: { in: ["generating", "processing"] },
      },
    });
  },

  updateStatus(
    id: string,
    status: string,
    data?: {
      audioUrl?: string;
      duration?: number;
      estimatedDuration?: number;
      errorMessage?: string;
    }
  ) {
    return prisma.audioOverview.update({
      where: { id },
      data: { status, ...data },
      include: { segments: { orderBy: { order: "asc" } } },
    });
  },

  delete(id: string) {
    return prisma.audioOverview.delete({ where: { id } });
  },
};
