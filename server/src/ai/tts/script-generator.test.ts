import { describe, it, expect, vi, beforeEach } from "vitest";
import { generatePodcastScript, estimateDuration, countWords } from "./script-generator";

const mockGenerateText = vi.hoisted(() => vi.fn());
const mockBuildAudioRagContext = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      chunks: [
        { id: "c1", text: "First chunk content.", sourceId: "s1", chunkIndex: 0, score: 0.9 },
        { id: "c2", text: "Second chunk content with more detail.", sourceId: "s1", chunkIndex: 1, score: 0.8 },
      ],
      iterations: 1,
      sourceTitles: new Map([["s1", "Doc A"]]),
      sourceTypes: new Map([["s1", "pdf"]]),
    })
  )
);

vi.mock("ai", () => ({
  generateText: mockGenerateText,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(() => "gpt-4o-mini-mock"),
}));

vi.mock("./audio-rag.service", () => ({
  buildAudioRagContext: mockBuildAudioRagContext,
}));

function makeScriptResponse(segments: Array<{ speaker: string; text: string; topic: string }>) {
  return {
    text: JSON.stringify({
      title: "Test Audio",
      segments: segments.map((s) => ({
        ...s,
        sources: [{ chunkId: "c1", snippet: "snippet" }],
      })),
    }),
  };
}

function makeLongText(wordCount: number): string {
  const base =
    "This sentence adds a few more words to the segment so that the total word count reaches the required minimum for the selected audio mode. ";
  const repeat = Math.ceil(wordCount / countWords(base));
  return base.repeat(repeat).trim();
}

describe("countWords", () => {
  it("counts words correctly", () => {
    expect(countWords("hello world")).toBe(2);
    expect(countWords("  one   two  three  ")).toBe(3);
  });
});

describe("estimateDuration", () => {
  it("estimates duration in seconds at 150 wpm", () => {
    expect(estimateDuration(300)).toBe(120); // 2 min
    expect(estimateDuration(150)).toBe(60); // 1 min
  });

  it("returns at least 60 seconds", () => {
    expect(estimateDuration(10)).toBe(60);
  });
});

describe("generatePodcastScript", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a script with estimated duration", async () => {
    mockGenerateText.mockResolvedValueOnce(
      makeScriptResponse([
        { speaker: "host_a", text: makeLongText(500), topic: "Intro" },
        { speaker: "host_b", text: makeLongText(500), topic: "Overview" },
      ])
    );

    const result = await generatePodcastScript("ws-1");

    expect(result.title).toBe("Test Audio");
    expect(result.segments).toHaveLength(2);
    expect(result.estimatedDuration).toBeGreaterThan(0);
    expect(mockBuildAudioRagContext).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      sourceTitle: undefined,
    });
  });

  it("retries when the script is too short", async () => {
    mockGenerateText
      .mockResolvedValueOnce(
        makeScriptResponse([
          { speaker: "host_a", text: "Hi.", topic: "Intro" },
          { speaker: "host_b", text: "Bye.", topic: "Outro" },
        ])
      )
      .mockResolvedValueOnce(
        makeScriptResponse([
          { speaker: "host_a", text: makeLongText(500), topic: "Intro" },
          { speaker: "host_b", text: makeLongText(500), topic: "Overview" },
        ])
      );

    const result = await generatePodcastScript("ws-1");

    expect(mockGenerateText).toHaveBeenCalledTimes(2);
    expect(result.estimatedDuration).toBeGreaterThanOrEqual(60);
  });

  it("does not retry when the script meets the word target", async () => {
    const longText =
      "This is a substantial segment that explains the concept in multiple sentences with examples and connections to other ideas, including the historical background, the underlying mathematical intuition, several concrete real-world applications, common pitfalls that practitioners encounter, and how this result relates to the broader literature in the field. The speaker should elaborate at length without rushing to the next point, providing enough spoken material for a full minute of audio.";
    mockGenerateText.mockResolvedValueOnce(
      makeScriptResponse(
        Array.from({ length: 50 }, (_, i) => ({
          speaker: i % 2 === 0 ? "host_a" : "host_b",
          text: longText,
          topic: `Topic ${i}`,
        }))
      )
    );

    const result = await generatePodcastScript("ws-1");

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    expect(result.segments).toHaveLength(50);
  });
});
