import { prisma } from "../lib/db";

const sourceInclude = {
  sources: {
    include: {
      source: {
        include: {
          workspace: { select: { id: true, title: true } },
        },
      },
    },
  },
} as const;

export const collectionRepository = {
  create(userId: string, data: { name: string; icon?: string }) {
    return prisma.collection.create({
      data: { ...data, userId },
      include: sourceInclude,
    });
  },

  findAllByUser(userId: string) {
    return prisma.collection.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      include: sourceInclude,
    });
  },

  findById(id: string) {
    return prisma.collection.findUnique({
      where: { id },
      include: sourceInclude,
    });
  },

  update(id: string, data: { name?: string; icon?: string; order?: number }) {
    return prisma.collection.update({
      where: { id },
      data,
      include: sourceInclude,
    });
  },

  delete(id: string) {
    return prisma.collection.delete({ where: { id } });
  },

  addSource(collectionId: string, sourceId: string) {
    return prisma.sourceCollection.create({
      data: { collectionId, sourceId },
    });
  },

  removeSource(collectionId: string, sourceId: string) {
    return prisma.sourceCollection.delete({
      where: { sourceId_collectionId: { sourceId, collectionId } },
    });
  },
};
