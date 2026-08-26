import { z } from "zod";

export const quizDifficultySchema = z.enum(["easy", "medium", "hard"]);

export const quizQuestionTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "fill_blank",
  "short_answer",
]);

export const generateQuizSchema = z.object({
  difficulty: quizDifficultySchema,
  questionCount: z.number().int().min(3).max(20),
  questionTypes: z.array(quizQuestionTypeSchema).min(1),
});

export const quizIdParamSchema = z.object({
  quizId: z.string().uuid(),
});

export const gradeQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.string(),
    })
  ),
});

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type GradeQuizInput = z.infer<typeof gradeQuizSchema>;
