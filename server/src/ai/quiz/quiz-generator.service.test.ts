import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateQuiz } from "./quiz-generator.service";

const mockGenerateObject = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      object: {
        questions: [
          {
            id: "q1",
            type: "multiple_choice",
            question: "What is the capital of France?",
            options: ["London", "Paris", "Berlin", "Madrid"],
            correctAnswer: "Paris",
            explanation: "Paris is the capital of France.",
            sourceRefs: [
              {
                chunkId: "c1",
                sourceId: "s1",
                sourceTitle: "Doc A",
                snippet: "Paris is the capital of France.",
              },
            ],
          },
          {
            id: "q2",
            type: "true_false",
            question: "The sky is blue.",
            options: ["True", "False"],
            correctAnswer: "True",
            explanation: "The sky appears blue due to Rayleigh scattering.",
            sourceRefs: [],
          },
        ],
      },
    })
  )
);

const mockBuildQuizRagContext = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      chunks: [
        {
          id: "c1",
          text: "Paris is the capital of France.",
          sourceId: "s1",
          sourceTitle: "Doc A",
          chunkIndex: 0,
          score: 0.9,
        },
      ],
      sourceTitles: new Map([["s1", "Doc A"]]),
    })
  )
);

vi.mock("ai", () => ({
  generateObject: mockGenerateObject,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "gpt-4o-mini-mock"),
}));

vi.mock("./quiz-rag.service", () => ({
  buildQuizRagContext: mockBuildQuizRagContext,
}));

describe("generateQuiz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a quiz with the requested number of questions", async () => {
    const result = await generateQuiz("ws-1", {
      difficulty: "medium",
      questionCount: 2,
      questionTypes: ["multiple_choice", "true_false"],
    });

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("multiple_choice");
    expect(result[0].options).toHaveLength(4);
    expect(result[1].type).toBe("true_false");
    expect(mockBuildQuizRagContext).toHaveBeenCalledWith(
      "ws-1",
      "medium",
      2
    );
  });

  it("filters out source refs with invalid chunk ids", async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        questions: [
          {
            id: "q1",
            type: "fill_blank",
            question: "The capital of France is ____.",
            correctAnswer: "Paris",
            explanation: "Paris is the capital.",
            sourceRefs: [
              {
                chunkId: "invalid-id",
                sourceId: "s1",
                sourceTitle: "Doc A",
                snippet: "invalid",
              },
            ],
          },
        ],
      },
    } as any);

    const result = await generateQuiz("ws-1", {
      difficulty: "easy",
      questionCount: 1,
      questionTypes: ["fill_blank"],
    });

    expect(result[0].sourceRefs).toHaveLength(0);
  });
});
