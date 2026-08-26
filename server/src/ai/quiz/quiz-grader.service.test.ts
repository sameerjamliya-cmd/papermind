import { describe, it, expect, vi, beforeEach } from "vitest";
import { gradeQuiz } from "./quiz-grader.service";

const mockGenerateObject = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      object: {
        questions: [
          {
            id: "q1",
            score: 1,
            maxScore: 1,
            isCorrect: true,
            feedback: "Correct!",
          },
          {
            id: "q2",
            score: 0,
            maxScore: 1,
            isCorrect: false,
            feedback: "Incorrect.",
          },
        ],
      },
    })
  )
);

vi.mock("ai", () => ({
  generateObject: mockGenerateObject,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "gpt-4o-mini-mock"),
}));

describe("gradeQuiz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a graded result with score and expression", async () => {
    const questions = [
      {
        id: "q1",
        type: "multiple_choice" as const,
        question: "What is 2+2?",
        options: ["3", "4", "5"],
        correctAnswer: "4",
        explanation: "Two plus two equals four.",
        sourceRefs: [],
      },
      {
        id: "q2",
        type: "short_answer" as const,
        question: "Explain gravity.",
        correctAnswer: "Gravity is a force.",
        explanation: "Gravity pulls objects together.",
        sourceRefs: [],
      },
    ];

    const result = await gradeQuiz(questions, [
      { questionId: "q1", answer: "4" },
      { questionId: "q2", answer: "It is a force of attraction." },
    ]);

    expect(result.score).toBe(1);
    expect(result.maxScore).toBe(3);
    expect(result.percentage).toBe(33);
    expect(result.expression).toBeTruthy();
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].isCorrect).toBe(true);
    expect(result.questions[1].maxScore).toBe(2);
  });
});
