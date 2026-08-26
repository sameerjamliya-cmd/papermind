import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma";
import type { ListSourcesQuery } from "../validator/source-validator";

type CreateSourceData = Prisma.SourceCreateInput;

export const sourceRepository = {
  create(data: CreateSourceData) {
    return prisma.source.create({ data });
  },

  findById(id: string) {
    return prisma.source.findUnique({ where: { id } });
  },

  async findAllByWorkspace(workspaceId: string, query: ListSourcesQuery) {
    const { page, limit, status, type, search } = query;

    const where: Record<string, unknown> = { workspaceId };
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [sources, total] = await Promise.all([
      prisma.source.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.source.count({ where }),
    ]);

    return { sources, total };
  },

  update(id: string, data: Prisma.SourceUpdateInput) {
    return prisma.source.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.source.delete({ where: { id } });
  },

  bulkDelete(ids: string[]) {
    return prisma.source.deleteMany({
      where: { id: { in: ids } },
    });
  },
};
