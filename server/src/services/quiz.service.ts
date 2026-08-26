import { NotFoundError, ForbiddenError } from "../types/app-error";
import { quizRepository } from "../repository/quiz.repository";
import { workspaceRepository } from "../repository/workspace.repository";
import { inngest } from "../inngest/client";
import { gradeQuiz } from "../ai/quiz/quiz-grader.service";
import type {
  QuizConfig,
  QuizAnswer,
  QuizResult,
  QuizQuestion,
} from "../types";

async function getOwnedWorkspace(workspaceId: string, userId: string) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found");
  if (workspace.userId !== userId) throw new ForbiddenError();
  return workspace;
}

export const quizService = {
  async requestQuiz(
    workspaceId: string,
    userId: string,
    config: QuizConfig
  ) {
    await getOwnedWorkspace(workspaceId, userId);

    const quiz = await quizRepository.create({
      workspaceId,
      userId,
      config,
    });

    await inngest.send({
      name: "quiz.requested",
      data: {
        quizId: quiz.id,
        workspaceId,
        userId,
        config,
      },
    });

    return quiz;
  },

  async getQuiz(quizId: string, workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) throw new NotFoundError("Quiz not found");
    if (quiz.workspaceId !== workspaceId || quiz.userId !== userId) {
      throw new ForbiddenError();
    }
    return quiz;
  },

  async submitAnswers(
    quizId: string,
    workspaceId: string,
    userId: string,
    answers: QuizAnswer[]
  ): Promise<QuizResult> {
    await getOwnedWorkspace(workspaceId, userId);
    const quiz = await quizRepository.findReadyById(quizId);
    if (!quiz) throw new NotFoundError("Quiz not found or not ready");
    if (quiz.workspaceId !== workspaceId || quiz.userId !== userId) {
      throw new ForbiddenError();
    }

    const questions = quiz.questions as unknown as QuizQuestion[];
    if (!questions || questions.length === 0) {
      throw new Error("Quiz has no questions");
    }

    const result = await gradeQuiz(questions, answers);

    // Clean up after grading since we don't keep records.
    await quizRepository.delete(quizId).catch(() => {});

    return result;
  },
};
