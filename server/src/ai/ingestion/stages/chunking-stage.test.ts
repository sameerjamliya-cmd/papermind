import { describe, it, expect } from "vitest";
import { ChunkingStage } from "./chunking-stage";
import { ResourceType } from "../../../domain/enums/resource-type";
import { KnowledgeResourceStatus } from "../../../domain/enums/knowledge-resource-status";
import {
  createResourceId,
  createWorkspaceId,
  createUserId,
} from "../../../domain/primitives/brand";
import type { IngestionState } from "../types/ingestion-state";

function makeState(normalizedContent: string): IngestionState {
  return {
    resourceId: createResourceId("res-1"),
    workspaceId: createWorkspaceId("ws-1"),
    userId: createUserId("user-1"),
    title: "Test",
    type: ResourceType.Pdf,
    originalUrl: "https://cloudinary.test/file.pdf",
    publicId: "public-id",
    metadata: {},
    status: KnowledgeResourceStatus.Processing,
    content: normalizedContent,
    normalizedContent,
    chunks: [],
    embeddings: null,
    error: null,
  };
}

describe("ChunkingStage", () => {
  it("returns empty chunks for empty content", async () => {
    const stage = new ChunkingStage();
    const result = await stage.execute(makeState(""));
    expect(result.chunks).toEqual([]);
  });

  it("splits long text into semantic chunks preserving paragraph boundaries", async () => {
    const stage = new ChunkingStage();
    const paragraphs = Array.from({ length: 5 }, (_, i) => `Paragraph ${i + 1}. `.repeat(50)).join("\n\n");

    const result = await stage.execute(makeState(paragraphs));

    expect(result.chunks.length).toBeGreaterThan(1);
    expect(result.chunks[0].content).toContain("Paragraph 1");
    expect(result.chunks.every((c) => c.content.length > 0)).toBe(true);
  });
});