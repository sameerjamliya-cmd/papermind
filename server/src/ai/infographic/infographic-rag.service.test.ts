import { describe, it, expect, vi, beforeEach } from "vitest";
import { InfographicRAGService } from "./infographic-rag.service";

const mockFindAllByWorkspace = vi.hoisted(() => vi.fn());
const mockFindBySourceId = vi.hoisted(() => vi.fn());
const mockFindNeighbors = vi.hoisted(() => vi.fn());
const mockHybridRetrieval = vi.hoisted(() => vi.fn());
const mockExpandQuery = vi.hoisted(() => vi.fn());

vi.mock("../../repository/source.repository", () => ({
  sourceRepository: {
    findAllByWorkspace: mockFindAllByWorkspace,
  },
}));

vi.mock("../../repository/chunk.repository", () => ({
  chunkRepository: {
    findBySourceId: mockFindBySourceId,
    findNeighbors: mockFindNeighbors,
  },
}));

vi.mock("../retrieval/retrieval.service", () => ({
  hybridRetrieval: mockHybridRetrieval,
}));

vi.mock("../reasoning/query-expansion.service", () => ({
  expandQuery: mockExpandQuery,
}));

function source(id: string, title: string) {
  return { id, title, type: "text" };
}

function chunkRow(sourceId: string, index: number, text: string) {
  return { id: `${sourceId}-uuid-${index}`, sourceId, index, text };
}

function headerlessChunks(sourceId: string, count: number) {
  return Array.from({ length: count }, (_, i) =>
    chunkRow(
      sourceId,
      i,
      `Chunk number ${i} with some meaningful content about topic ${i % 3}.`
    )
  );
}

const HEADING_CHUNKS = [
  chunkRow("s1", 0, "# Introduction\nBasic intro text about the subject."),
  chunkRow("s1", 1, "More introductory details follow here."),
  chunkRow("s1", 2, "# Variables\nVariables store values in memory."),
  chunkRow("s1", 3, "Variables can be reassigned at runtime."),
  chunkRow("s1", 4, "# Loops\nLoops repeat a block of work."),
  chunkRow("s1", 5, "For loops iterate over sequences."),
  chunkRow("s1", 6, "# Functions\nFunctions encapsulate logic."),
  chunkRow("s1", 7, "Functions take arguments and return values."),
];

const service = new InfographicRAGService();

describe("InfographicRAGService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindNeighbors.mockResolvedValue([]);
    mockHybridRetrieval.mockResolvedValue([]);
    mockExpandQuery.mockResolvedValue({
      stepBack: "What are the broader principles?",
      subQuestions: ["What are the core concepts?", "What are examples?"],
      synonyms: ["concepts", "ideas"],
    });
  });

  it("caps context size at the target chunk count", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    mockFindBySourceId.mockResolvedValue(headerlessChunks("s1", 60));

    const result = await service.retrieveForInfographic({ workspaceId: "ws" });

    expect(result.chunks.length).toBeLessThanOrEqual(40);
    expect(result.sourceTitles.get("s1")).toBe("Doc A");
  });

  it("covers all detected sections from markdown headings", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    mockFindBySourceId.mockResolvedValue(HEADING_CHUNKS);

    const result = await service.retrieveForInfographic({ workspaceId: "ws" });

    const sectionTitles = new Set(result.chunks.map((c) => c.sectionTitle));
    for (const expected of ["Introduction", "Variables", "Loops", "Functions"]) {
      expect(sectionTitles.has(expected)).toBe(true);
    }
    expect(result.sections.length).toBe(4);
    for (const section of result.sections) {
      expect(section.chunkIds.length).toBeGreaterThan(0);
    }
  });

  it("uses the prompt for retrieval and expands it best-effort", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    mockFindBySourceId.mockResolvedValue(headerlessChunks("s1", 20));
    mockHybridRetrieval.mockResolvedValue([
      { id: "s1-5", text: "Chunk number 5 with some meaningful content about topic 2.", sourceId: "s1", chunkIndex: 5, score: 0.9 },
    ]);

    await service.retrieveForInfographic({
      workspaceId: "ws",
      prompt: "Explain the memory hierarchy",
    });

    const queries = mockHybridRetrieval.mock.calls.map((c) => c[0][0]);
    expect(queries).toContain("Explain the memory hierarchy");
    expect(queries).toContain("What are the broader principles?");
    expect(mockExpandQuery).toHaveBeenCalledWith("Explain the memory hierarchy");
  });

  it("falls back to coverage queries when expansion fails", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    mockFindBySourceId.mockResolvedValue(headerlessChunks("s1", 20));
    mockExpandQuery.mockRejectedValue(new Error("boom"));

    await expect(
      service.retrieveForInfographic({ workspaceId: "ws", prompt: "anything" })
    ).resolves.toBeDefined();
  });

  it("expands neighbors of anchored/important chunks within the same source", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    mockFindBySourceId.mockResolvedValue(headerlessChunks("s1", 30));
    mockHybridRetrieval.mockResolvedValue([
      { id: "s1-15", text: "Chunk number 15 with some meaningful content about topic 0.", sourceId: "s1", chunkIndex: 15, score: 0.9 },
    ]);
    mockFindNeighbors.mockResolvedValue([
      chunkRow("s1", 14, "Chunk number 14 with some meaningful content about topic 2."),
      chunkRow("s1", 16, "Chunk number 16 with some meaningful content about topic 1."),
    ]);

    const result = await service.retrieveForInfographic({ workspaceId: "ws" });

    const indexes = result.chunks.map((c) => c.chunkIndex);
    expect(indexes).toContain(14);
    expect(indexes).toContain(15);
    expect(indexes).toContain(16);
  });

  it("orders output by source, then section, then chunk index", async () => {
    const s1 = source("s1", "Doc A");
    const s2 = source("s2", "Doc B");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1, s2], total: 2 });
    mockFindBySourceId.mockImplementation((id: string) =>
      id === "s1" ? HEADING_CHUNKS : headerlessChunks("s2", 4)
    );

    const result = await service.retrieveForInfographic({ workspaceId: "ws" });

    const keys = result.chunks.map(
      (c) => `${c.sourceId}:${c.sectionTitle}:${c.chunkIndex}`
    );
    expect(keys.slice(0, 4)).toEqual([
      "s1:Introduction:0",
      "s1:Introduction:1",
      "s1:Variables:2",
      "s1:Variables:3",
    ]);
    expect(keys.slice(-4)).toEqual([
      "s2:Doc B:0",
      "s2:Doc B:1",
      "s2:Doc B:2",
      "s2:Doc B:3",
    ]);
  });

  it("restricts scope to requested sources and rejects foreign ids", async () => {
    const s1 = source("s1", "Doc A");
    const s2 = source("s2", "Doc B");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1, s2], total: 2 });
    mockFindBySourceId.mockImplementation((id: string) =>
      id === "s1" ? headerlessChunks("s1", 5) : headerlessChunks("s2", 5)
    );

    const result = await service.retrieveForInfographic({
      workspaceId: "ws",
      sourceIds: ["s1"],
    });
    expect(result.chunks.every((c) => c.sourceId === "s1")).toBe(true);

    await expect(
      service.retrieveForInfographic({
        workspaceId: "ws",
        sourceIds: ["foreign"],
      })
    ).rejects.toThrow(/not found in this workspace/);
  });

  it("throws when no sources exist", async () => {
    mockFindAllByWorkspace.mockResolvedValue({ sources: [], total: 0 });

    await expect(
      service.retrieveForInfographic({ workspaceId: "ws" })
    ).rejects.toThrow(/No sources found/);
  });

  it("throws when sources have no chunked content", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    mockFindBySourceId.mockResolvedValue([]);

    await expect(
      service.retrieveForInfographic({ workspaceId: "ws" })
    ).rejects.toThrow(/No chunked content/);
  });
});