import { describe, it, expect, vi, beforeEach } from "vitest";
import { planInfographic } from "./infographic-planner.service";
import type { InfographicRagContext } from "./infographic-rag.service";

const mockGenerateObject = vi.hoisted(() => vi.fn());

vi.mock("ai", () => ({
  generateObject: mockGenerateObject,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: () => ({}),
}));

const context: InfographicRagContext = {
  chunks: [
    {
      id: "s1-0",
      text: "# Introduction\nBasic intro text about the subject.",
      sourceId: "s1",
      sourceTitle: "Doc A",
      chunkIndex: 0,
      sectionTitle: "Introduction",
    },
    {
      id: "s1-2",
      text: "# Variables\nVariables store values in memory.",
      sourceId: "s1",
      sourceTitle: "Doc A",
      chunkIndex: 2,
      sectionTitle: "Variables",
    },
  ],
  sections: [
    {
      sourceId: "s1",
      sourceTitle: "Doc A",
      title: "Introduction",
      chunkIds: ["s1-0"],
    },
    {
      sourceId: "s1",
      sourceTitle: "Doc A",
      title: "Variables",
      chunkIds: ["s1-2"],
    },
  ],
  sourceTitles: new Map([["s1", "Doc A"]]),
};

const style = {
  id: "modern" as const,
  name: "Modern",
  description: "Contemporary cards, clean hierarchy and subtle accent colors.",
  visualDescription: "Rounded cards with subtle borders and soft shadows.",
};

const language = {
  code: "hi" as const,
  label: "Hindi",
  nativeName: "हिन्दी",
  fontScript: "devanagari",
};

describe("planInfographic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns enriched content with valid source refs only", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        title: "मेमोरी पदानुक्रम",
        subtitle: "एक संक्षिप्त अवलोकन",
        sections: [
          {
            id: "sec-1",
            title: "परिचय",
            summary: "मूल अवधारणाएँ।",
            keyPoints: ["पहला बिंदु"],
            visualType: "concept_map",
            sourceRefs: [
              { chunkId: "s1-0", sourceId: "s1", sourceTitle: "Doc A", snippet: "Basic intro text about the subject." },
              { chunkId: "foreign-99", sourceId: "evil", sourceTitle: "Evil", snippet: "Should be dropped." },
            ],
          },
        ],
        relationships: [],
      },
    });

    const result = await planInfographic({
      context,
      style,
      language,
      prompt: "focus on basics",
      styleId: "modern",
      languageCode: "hi",
    });

    expect(result.title).toBe("मेमोरी पदानुक्रम");
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].sourceRefs).toHaveLength(1);
    expect(result.sections[0].sourceRefs[0].chunkId).toBe("s1-0");
    expect(result.sections[0].sourceRefs[0].sourceTitle).toBe("Doc A");
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    const promptText = mockGenerateObject.mock.calls[0][0].prompt as string;
    expect(promptText).toContain("Modern");
    expect(promptText).toContain("हिन्दी");
    expect(promptText).toContain("focus on basics");
    expect(promptText).toContain("[CHUNK_0]");
    expect(promptText).toContain("DOCUMENT: Doc A");
  });

  it("maps source metadata from the chunk map when refs differ", async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        title: "Title",
        subtitle: "",
        sections: [
          {
            id: "sec-1",
            title: "Sec",
            summary: "Sum.",
            keyPoints: ["Point"],
            visualType: "timeline",
            sourceRefs: [
              { chunkId: "s1-2", sourceId: "WRONG", sourceTitle: "WRONG TITLE", snippet: "Variables store values in memory." },
            ],
          },
        ],
        relationships: [],
      },
    });

    const result = await planInfographic({
      context,
      style,
      language,
      styleId: "modern",
      languageCode: "hi",
    });

    expect(result.sections[0].sourceRefs[0].sourceId).toBe("s1");
    expect(result.sections[0].sourceRefs[0].sourceTitle).toBe("Doc A");
  });

  it("throws when there is no context", async () => {
    await expect(
      planInfographic({
        context: { chunks: [], sections: [], sourceTitles: new Map() },
        style,
        language,
        styleId: "modern",
        languageCode: "hi",
      })
    ).rejects.toThrow(/No source context/);
  });
});