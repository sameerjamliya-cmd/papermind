import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  deduplicateChunks,
  assembleCoherentContext,
  buildAudioRagContext,
} from "./audio-rag.service";
import type { RetrievedChunk } from "../retrieval/retrieval-types";

const mockExpandQuery = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      stepBack: "broad query",
      synonyms: ["term"],
      subQuestions: ["q1", "q2"],
    })
  )
);

const mockHybridRetrieval = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve<RetrievedChunk[]>([
      { id: "c2", text: "second", sourceId: "s1", chunkIndex: 2, score: 0.9 },
      { id: "c5", text: "fifth", sourceId: "s2", chunkIndex: 5, score: 0.8 },
    ])
  )
);

const mockFindById = vi.hoisted(() =>
  vi.fn((id: string) =>
    Promise.resolve({
      id,
      title: id === "s1" ? "Doc A" : "Doc B",
      type: "pdf",
    })
  )
);

const mockGenerateObject = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      object: {
        relevance: 8,
        coverage: 8,
        redundancy: 8,
        sourceCompleteness: 8,
        sufficient: true,
        improvedQuery: "",
      },
    })
  )
);

vi.mock("../reasoning/query-expansion.service", () => ({
  expandQuery: mockExpandQuery,
}));

vi.mock("../retrieval/retrieval.service", () => ({
  hybridRetrieval: mockHybridRetrieval,
}));

vi.mock("../../repository/source.repository", () => ({
  sourceRepository: {
    findById: mockFindById,
  },
}));

vi.mock("ai", () => ({
  generateObject: mockGenerateObject,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "gpt-4o-mini-mock"),
}));

function makeChunk(
  id: string,
  sourceId: string,
  chunkIndex: number,
  text = `chunk ${id}`,
  score?: number
): RetrievedChunk {
  return { id, sourceId, chunkIndex, text, score };
}

describe("deduplicateChunks", () => {
  it("removes duplicate chunk ids keeping first occurrence", () => {
    const chunks = [
      makeChunk("a", "s1", 0, "first", 0.9),
      makeChunk("b", "s1", 1, "second", 0.8),
      makeChunk("a", "s1", 0, "duplicate", 0.7),
    ];
    expect(deduplicateChunks(chunks)).toHaveLength(2);
    expect(deduplicateChunks(chunks)[0].score).toBe(0.9);
  });
});

describe("assembleCoherentContext", () => {
  it("sorts chunks by source id then chunk index", () => {
    const chunks = [
      makeChunk("c", "s2", 2),
      makeChunk("a", "s1", 0),
      makeChunk("b", "s1", 1),
      makeChunk("d", "s2", 0),
    ];
    const ordered = assembleCoherentContext(chunks);
    expect(ordered.map((c) => c.id)).toEqual(["a", "b", "d", "c"]);
  });
});

describe("buildAudioRagContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves coherent context", async () => {
    mockHybridRetrieval.mockResolvedValueOnce([
      makeChunk("c2", "s1", 2, "second", 0.9),
      makeChunk("c5", "s2", 5, "fifth", 0.8),
    ]);

    const ctx = await buildAudioRagContext({
      workspaceId: "ws-1",
    });

    expect(mockHybridRetrieval).toHaveBeenCalled();
    expect(ctx.chunks.length).toBeLessThanOrEqual(10);
    expect(ctx.sourceTitles.get("s1")).toBe("Doc A");
    expect(ctx.sourceTitles.get("s2")).toBe("Doc B");
  });

  it("retries when quality is insufficient", async () => {
    mockHybridRetrieval
      .mockResolvedValueOnce([makeChunk("c2", "s1", 2, "second", 0.9)])
      .mockResolvedValueOnce([makeChunk("c10", "s1", 10, "extra", 0.7)]);

    mockGenerateObject
      .mockResolvedValueOnce({
        object: {
          relevance: 4,
          coverage: 3,
          redundancy: 8,
          sourceCompleteness: 5,
          sufficient: false,
          improvedQuery: "more comprehensive lecture",
        } as any,
      })
      .mockResolvedValueOnce({
        object: {
          relevance: 8,
          coverage: 8,
          redundancy: 8,
          sourceCompleteness: 8,
          sufficient: true,
          improvedQuery: "",
        } as any,
      });

    const ctx = await buildAudioRagContext({
      workspaceId: "ws-1",
    });

    expect(mockHybridRetrieval).toHaveBeenCalledTimes(2);
    expect(ctx.chunks.length).toBeGreaterThanOrEqual(1);
  });

  it("limits chunks to the configured maximum", async () => {
    const manyChunks = Array.from({ length: 50 }, (_, i) =>
      makeChunk(`c${i}`, `s${i % 3}`, i, `chunk ${i}`, 1 - i * 0.01)
    );
    mockHybridRetrieval.mockResolvedValueOnce(manyChunks);

    const ctx = await buildAudioRagContext({
      workspaceId: "ws-1",
    });

    expect(ctx.chunks.length).toBeLessThanOrEqual(10);
  });
});
