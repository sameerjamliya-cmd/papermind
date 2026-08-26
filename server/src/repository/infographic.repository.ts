import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma";
import type { InfographicConfig, InfographicContent } from "../types";

export const infographicRepository = {
  create(data: {
    workspaceId: string;
    userId: string;
    config: InfographicConfig;
    language: string;
    cacheKey: string;
    plannerVersion: number;
    rendererVersion: number;
  }) {
    return prisma.infographic.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        config: data.config as unknown as Prisma.InputJsonValue,
        language: data.language,
        cacheKey: data.cacheKey,
        plannerVersion: data.plannerVersion,
        rendererVersion: data.rendererVersion,
        status: "generating",
      },
    });
  },

  findById(id: string) {
    return prisma.infographic.findUnique({ where: { id } });
  },

  findByWorkspace(workspaceId: string) {
    return prisma.infographic.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  },

  findByCacheKey(workspaceId: string, cacheKey: string) {
    return prisma.infographic.findFirst({
      where: { workspaceId, cacheKey },
    });
  },

  updateStatus(
    id: string,
    status: string,
    data?: {
      content?: InfographicContent;
      errorMessage?: string;
    }
  ) {
    const updateData: Prisma.InfographicUpdateInput = { status };
    if (data) {
      if (data.content !== undefined) {
        updateData.content = data.content as unknown as Prisma.InputJsonValue;
      }
      if (data.errorMessage !== undefined) {
        updateData.errorMessage = data.errorMessage;
      }
    }
    return prisma.infographic.update({ where: { id }, data: updateData });
  },

  delete(id: string) {
    return prisma.infographic.delete({ where: { id } });
  },
};