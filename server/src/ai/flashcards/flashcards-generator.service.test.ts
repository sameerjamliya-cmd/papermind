import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateFlashcards } from "./flashcards-generator.service";

const mockGenerateObject = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      object: {
        cards: [
          {
            id: "c1",
            front: "What is the capital of France?",
            back: "Paris — the capital and largest city of France.",
            hint: "A French city on the Seine",
            sourceRefs: [
              {
                chunkId: "chunk-1",
                sourceId: "s1",
                sourceTitle: "Doc A",
                snippet: "Paris is the capital of France.",
              },
            ],
          },
          {
            id: "c2",
            front: "Light travels in a vacuum at what speed?",
            back: "Roughly 3×10^8 m/s.",
            sourceRefs: [],
          },
        ],
      },
    })
  )
);

const mockBuildFlashcardsRagContext = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      chunks: [
        {
          id: "chunk-1",
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

vi.mock("./flashcards-rag.service", () => ({
  buildFlashcardsRagContext: mockBuildFlashcardsRagContext,
}));

describe("generateFlashcards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a deck with the requested number of cards", async () => {
    const result = await generateFlashcards("ws-1", 2);

    expect(result).toHaveLength(2);
    expect(result[0].front).toBe("What is the capital of France?");
    expect(result[0].back).toContain("Paris");
    expect(result[0].sourceRefs).toHaveLength(1);
    expect(mockBuildFlashcardsRagContext).toHaveBeenCalledWith("ws-1", 2);
  });

  it("filters out source refs with invalid chunk ids", async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        cards: [
          {
            id: "c1",
            front: "Term",
            back: "Definition",
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

    const result = await generateFlashcards("ws-1", 1);

    expect(result[0].sourceRefs).toHaveLength(0);
  });
});