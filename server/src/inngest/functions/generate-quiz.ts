import { inngest } from "../client";
import { quizRepository } from "../../repository/quiz.repository";
import { generateQuiz } from "../../ai/quiz/quiz-generator.service";
import type { QuizConfig } from "../../types";

export const generateQuizFn: ReturnType<typeof inngest.createFunction> =
  inngest.createFunction(
    {
      id: "generate-quiz",
      name: "Generate Quiz",
      retries: 2,
      triggers: [{ event: "quiz.requested" }],
    },
    async ({ event, step }) => {
      const { quizId, workspaceId, config } = event.data as {
        quizId: string;
        workspaceId: string;
        userId: string;
        config: QuizConfig;
      };

      await step.run("mark-processing", () =>
        quizRepository.updateStatus(quizId, "processing")
      );

      try {
        const questions = await step.run("generate-questions", async () => {
          return generateQuiz(workspaceId, config);
        });

        await step.run("mark-ready", () =>
          quizRepository.updateStatus(quizId, "ready", { questions })
        );

        return { quizId, questionCount: questions.length };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await step.run("mark-failed", () =>
          quizRepository.updateStatus(quizId, "failed", {
            errorMessage: message,
          })
        );
        throw error;
      }
    }
  );
