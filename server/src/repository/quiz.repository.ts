import { prisma } from "../lib/db";
import type { Prisma } from "../generated/prisma";
import type { QuizConfig } from "../types";
import type { QuizQuestion } from "../types";

export const quizRepository = {
  create(data: {
    workspaceId: string;
    userId: string;
    config: QuizConfig;
  }) {
    return prisma.quiz.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        config: data.config as unknown as Prisma.InputJsonValue,
        status: "generating",
      },
    });
  },

  findById(id: string) {
    return prisma.quiz.findUnique({ where: { id } });
  },

  findReadyById(id: string) {
    return prisma.quiz.findFirst({
      where: { id, status: "ready" },
    });
  },

  updateStatus(
    id: string,
    status: string,
    data?: {
      questions?: QuizQuestion[];
      errorMessage?: string;
    }
  ) {
    const updateData: Prisma.QuizUpdateInput = { status };
    if (data) {
      if (data.questions !== undefined) {
        updateData.questions = data.questions as unknown as Prisma.InputJsonValue;
      }
      if (data.errorMessage !== undefined) {
        updateData.errorMessage = data.errorMessage;
      }
    }
    return prisma.quiz.update({
      where: { id },
      data: updateData,
    });
  },

  delete(id: string) {
    return prisma.quiz.delete({ where: { id } });
  },
};
