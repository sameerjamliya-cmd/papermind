import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type {
  QuizAnswer,
  QuizQuestion,
  QuizResult,
  GradedQuizQuestion,
} from "../../types";

const gradingSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string().min(1),
      score: z.number().min(0),
      maxScore: z.number().min(1),
      isCorrect: z.boolean(),
      feedback: z.string().min(1),
    })
  ),
});

function getDefaultMaxScore(type: QuizQuestion["type"]): number {
  switch (type) {
    case "multiple_choice":
    case "true_false":
    case "fill_blank":
      return 1;
    case "short_answer":
      return 2;
    default:
      return 1;
  }
}

function getExpression(percentage: number): string {
  if (percentage >= 90) return "Outstanding! You're mastering this material. 🏆";
  if (percentage >= 75) return "Great job! You have a strong grasp of the content. 🎉";
  if (percentage >= 60) return "Good effort! A little review will solidify your understanding. 👍";
  if (percentage >= 40) return "Keep learning! Review the explanations and try again. 📚";
  return "Don't give up! Go through the explanations and retake the quiz. 💪";
}

export async function gradeQuiz(
  questions: QuizQuestion[],
  answers: QuizAnswer[]
): Promise<QuizResult> {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

  const promptQuestions = questions.map((q) => {
    const userAnswer = answerMap.get(q.id) ?? "";
    return {
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer,
    };
  });

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: gradingSchema,
    prompt: `You are grading a quiz. Evaluate each user answer against the correct answer.

Scoring rules:
- multiple_choice and true_false: award full maxScore only if the user answer exactly matches the correct answer. Otherwise 0.
- fill_blank: award full maxScore if the user answer is semantically equivalent to the correct answer (case insensitive, synonyms allowed). Minor spelling errors are okay.
- short_answer: award partial credit based on completeness and accuracy. Compare the user's answer to the correct answer and give 0, half, or full marks.

For each question return:
- score: numeric score awarded
- maxScore: maximum possible score (use 1 for MC/TF/fill_blank, 2 for short_answer)
- isCorrect: true if score equals maxScore
- feedback: a short sentence explaining why the answer was correct or incorrect

Questions:
${JSON.stringify(promptQuestions, null, 2)}`,
    temperature: 0.3,
  });

  const gradedMap = new Map(object.questions.map((g) => [g.id, g]));

  let score = 0;
  let maxScore = 0;

  const gradedQuestions: GradedQuizQuestion[] = questions.map((q) => {
    const userAnswer = answerMap.get(q.id) ?? "";
    const graded = gradedMap.get(q.id);
    const max = getDefaultMaxScore(q.type);

    const finalScore = graded?.score ?? (userAnswer.trim() ? 0 : 0);
    const finalIsCorrect = graded?.isCorrect ?? false;
    const feedback =
      graded?.feedback ??
      (userAnswer.trim()
        ? "This answer was not recognized."
        : "No answer was provided.");

    score += finalScore;
    maxScore += max;

    return {
      ...q,
      userAnswer,
      score: finalScore,
      maxScore: max,
      isCorrect: finalIsCorrect,
      feedback,
    };
  });

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    score,
    maxScore,
    percentage,
    questions: gradedQuestions,
    expression: getExpression(percentage),
  };
}
