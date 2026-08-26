import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma";
import type { FlashcardConfig, Flashcard } from "../types";

export const flashcardsRepository = {
  create(data: {
    workspaceId: string;
    userId: string;
    config: FlashcardConfig;
  }) {
    return prisma.flashcardSet.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        config: data.config as unknown as Prisma.InputJsonValue,
        status: "generating",
      },
    });
  },

  findById(id: string) {
    return prisma.flashcardSet.findUnique({ where: { id } });
  },

  findAllByWorkspace(workspaceId: string) {
    return prisma.flashcardSet.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  },

  updateStatus(
    id: string,
    status: string,
    data?: {
      cards?: Flashcard[];
      errorMessage?: string;
    }
  ) {
    const updateData: Prisma.FlashcardSetUpdateInput = { status };
    if (data) {
      if (data.cards !== undefined) {
        updateData.cards = data.cards as unknown as Prisma.InputJsonValue;
      }
      if (data.errorMessage !== undefined) {
        updateData.errorMessage = data.errorMessage;
      }
    }
    return prisma.flashcardSet.update({
      where: { id },
      data: updateData,
    });
  },

  delete(id: string) {
    return prisma.flashcardSet.delete({ where: { id } });
  },
};