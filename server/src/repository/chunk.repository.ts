import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma";

export const chunkRepository = {
  findById(id: string) {
    return prisma.chunk.findUnique({ where: { id } });
  },

  createMany(chunks: Prisma.ChunkCreateManyInput[]) {
    return prisma.chunk.createMany({ data: chunks });
  },

  findByWorkspace(workspaceId: string) {
    return prisma.chunk.findMany({
      where: { workspaceId },
      orderBy: [{ sourceId: "asc" }, { index: "asc" }],
    });
  },

  findBySourceId(sourceId: string) {
    return prisma.chunk.findMany({
      where: { sourceId },
      orderBy: { index: "asc" },
    });
  },

  findNeighbors(sourceId: string, index: number, window: number) {
    return prisma.chunk.findMany({
      where: {
        sourceId,
        index: {
          gte: Math.max(0, index - window),
          lte: index + window,
        },
      },
      orderBy: { index: "asc" },
    });
  },

  searchByKeywords(workspaceId: string, keywords: string[], take: number) {
    const conditions = keywords.map((kw) => ({
      text: { contains: kw, mode: "insensitive" as const },
    }));
    return prisma.chunk.findMany({
      where: { workspaceId, OR: conditions },
      take,
      orderBy: { createdAt: "desc" },
    });
  },

  deleteBySourceId(sourceId: string) {
    return prisma.chunk.deleteMany({ where: { sourceId } });
  },

  async findAllByWorkspace(
    workspaceId: string,
    page: number,
    limit: number,
    sourceId?: string
  ) {
    const where: Record<string, unknown> = { workspaceId };
    if (sourceId) where.sourceId = sourceId;

    const [chunks, total] = await Promise.all([
      prisma.chunk.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { index: "asc" },
      }),
      prisma.chunk.count({ where }),
    ]);

    return { chunks, total };
  },
};
