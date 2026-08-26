import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardRAGService } from "./flashcards-rag.service";

const mockFindAllByWorkspace = vi.hoisted(() => vi.fn());
const mockFindBySourceId = vi.hoisted(() => vi.fn());
const mockFindNeighbors = vi.hoisted(() => vi.fn());
const mockHybridRetrieval = vi.hoisted(() => vi.fn());

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

function source(id: string, title: string) {
  return { id, title, type: "text" };
}

function chunkRow(sourceId: string, index: number, text: string) {
  return { id: `${sourceId}-uuid-${index}`, sourceId, index, text };
}

function headerlessChunks(sourceId: string, count: number) {
  return Array.from({ length: count }, (_, i) =>
    chunkRow(sourceId, i, `Chunk number ${i} with some meaningful content about topic ${i % 3}.`)
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

const service = new FlashcardRAGService();

describe("FlashcardRAGService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindNeighbors.mockResolvedValue([]);
    mockHybridRetrieval.mockResolvedValue([]);
  });

  it("scales context size with requested card count", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    mockFindBySourceId.mockResolvedValue(headerlessChunks("s1", 30));

    const small = await service.retrieveForFlashcards({ workspaceId: "ws", numberOfCards: 10 });
    const large = await service.retrieveForFlashcards({ workspaceId: "ws", numberOfCards: 50 });

    expect(small.chunks.length).toBeLessThanOrEqual(20);
    expect(large.chunks.length).toBe(30);
    expect(large.chunks.length).toBeGreaterThan(small.chunks.length);
  });

  it("covers all detected sections from markdown headings", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    mockFindBySourceId.mockResolvedValue(HEADING_CHUNKS);

    const result = await service.retrieveForFlashcards({ workspaceId: "ws", numberOfCards: 5 });

    const sectionTitles = new Set(result.chunks.map((c) => c.sectionTitle));
    for (const expected of ["Introduction", "Variables", "Loops", "Functions"]) {
      expect(sectionTitles.has(expected)).toBe(true);
    }
    expect(result.sections.length).toBe(4);
    for (const section of result.sections) {
      expect(section.chunkIds.length).toBeGreaterThan(0);
    }
  });

  it("expands neighbors of important chunks within the same source", async () => {
    const s1 = source("s1", "Doc A");
    const s2 = source("s2", "Doc B");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1, s2], total: 2 });
    mockFindBySourceId.mockImplementation((id: string) =>
      id === "s1" ? headerlessChunks("s1", 20) : headerlessChunks("s2", 20)
    );

    // Important-concept pass surfaces chunk 15 of s1 with a high score.
    mockHybridRetrieval.mockResolvedValue([
      { id: "s1-15", text: "Chunk number 15 with some meaningful content about topic 0.", sourceId: "s1", chunkIndex: 15, score: 0.9 },
    ]);

    mockFindNeighbors.mockResolvedValue([
      chunkRow("s1", 14, "Chunk number 14 with some meaningful content about topic 2."),
      chunkRow("s1", 16, "Chunk number 16 with some meaningful content about topic 1."),
    ]);

    const result = await service.retrieveForFlashcards({ workspaceId: "ws", numberOfCards: 10 });

    const s1Indexes = result.chunks.filter((c) => c.sourceId === "s1").map((c) => c.chunkIndex);
    expect(s1Indexes).toContain(14);
    expect(s1Indexes).toContain(15);
    expect(s1Indexes).toContain(16);
    expect(mockFindNeighbors).toHaveBeenCalledWith("s1", 15, 1);
  });

  it("deduplicates near-identical chunks", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    const dupText = "This exact same text appears twice in a row with no differences whatsoever.";
    mockFindBySourceId.mockResolvedValue([
      chunkRow("s1", 0, dupText),
      chunkRow("s1", 1, dupText),
    ]);

    const result = await service.retrieveForFlashcards({ workspaceId: "ws", numberOfCards: 5 });

    expect(result.chunks.length).toBe(1);
  });

  it("restricts scope to requested sources and rejects foreign ids", async () => {
    const s1 = source("s1", "Doc A");
    const s2 = source("s2", "Doc B");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1, s2], total: 2 });
    mockFindBySourceId.mockImplementation((id: string) =>
      id === "s1" ? headerlessChunks("s1", 5) : headerlessChunks("s2", 5)
    );

    const result = await service.retrieveForFlashcards({
      workspaceId: "ws",
      sourceIds: ["s1"],
      numberOfCards: 5,
    });
    expect(result.chunks.every((c) => c.sourceId === "s1")).toBe(true);

    await expect(
      service.retrieveForFlashcards({
        workspaceId: "ws",
        sourceIds: ["foreign"],
        numberOfCards: 5,
      })
    ).rejects.toThrow(/not found in this workspace/);
  });

  it("orders output by source, then section, then chunk index", async () => {
    const s1 = source("s1", "Doc A");
    const s2 = source("s2", "Doc B");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1, s2], total: 2 });
    mockFindBySourceId.mockImplementation((id: string) =>
      id === "s1" ? HEADING_CHUNKS : headerlessChunks("s2", 4)
    );

    const result = await service.retrieveForFlashcards({ workspaceId: "ws", numberOfCards: 10 });

    // Document order: source, then section first-appearance order, then chunk index.
    const keys = result.chunks.map((c) => `${c.sourceId}:${c.sectionTitle}:${c.chunkIndex}`);
    expect(keys).toEqual([
      "s1:Introduction:0",
      "s1:Introduction:1",
      "s1:Variables:2",
      "s1:Variables:3",
      "s1:Loops:4",
      "s1:Loops:5",
      "s1:Functions:6",
      "s1:Functions:7",
      "s2:Doc B:0",
      "s2:Doc B:1",
      "s2:Doc B:2",
      "s2:Doc B:3",
    ]);
  });

  it("throws when no sources exist", async () => {
    mockFindAllByWorkspace.mockResolvedValue({ sources: [], total: 0 });

    await expect(
      service.retrieveForFlashcards({ workspaceId: "ws", numberOfCards: 5 })
    ).rejects.toThrow(/No sources found/);
  });

  it("throws when sources have no chunked content", async () => {
    const s1 = source("s1", "Doc A");
    mockFindAllByWorkspace.mockResolvedValue({ sources: [s1], total: 1 });
    mockFindBySourceId.mockResolvedValue([]);

    await expect(
      service.retrieveForFlashcards({ workspaceId: "ws", numberOfCards: 5 })
    ).rejects.toThrow(/No chunked content/);
  });
});