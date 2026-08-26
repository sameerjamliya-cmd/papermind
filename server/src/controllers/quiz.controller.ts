import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { quizService } from "../services/quiz.service";
import { workspaceIdParamSchema } from "../validator/workspace-validator";
import {
  generateQuizSchema,
  quizIdParamSchema,
  gradeQuizSchema,
} from "../validator/quiz-validator";

export const quizController = {
  generate: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const body = generateQuizSchema.parse(req.body);

    const quiz = await quizService.requestQuiz(workspaceId, userId, body);
    res.status(201).json({ data: quiz });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { quizId } = quizIdParamSchema.parse(req.params);

    const quiz = await quizService.getQuiz(quizId, workspaceId, userId);
    res.json({ data: quiz });
  }),

  grade: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const { quizId } = quizIdParamSchema.parse(req.params);
    const body = gradeQuizSchema.parse(req.body);

    const result = await quizService.submitAnswers(
      quizId,
      workspaceId,
      userId,
      body.answers
    );
    res.json({ data: result });
  }),
};
