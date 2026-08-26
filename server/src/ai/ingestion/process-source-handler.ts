import { sourceRepository } from "../../repository/source.repository";
import { chunkRepository } from "../../repository/chunk.repository";
import { recursiveChunk } from "./chunking";
import { generateEmbeddings } from "../orchestrator/openai";
import { upsertChunks, deleteBySourceId } from "../retrieval/pinecone";
import { scrapeWebsite } from "./firecrawl";
import { extractYoutubeContent } from "./youtube";
import { searchTavily } from "./tavily";

async function fetchSourceContent(source: {
  id: string;
  type: string;
  content: string | null;
  fileUrl: string | null;
  url: string | null;
  metadata: unknown;
}): Promise<string> {
  switch (source.type) {
    case "pdf":
    case "website":
    case "text":
    case "markdown": {
      if (!source.content) throw new Error("Source content not found");
      return source.content;
    }

    case "youtube": {
      if (!source.url) throw new Error("YouTube URL not found");
      return extractYoutubeContent(source.url);
    }

    case "websearch": {
      const meta = source.metadata as {
        query?: string;
        maxResults?: number;
      };
      if (!meta?.query) throw new Error("Search query not found");

      const results = await searchTavily(meta.query, meta.maxResults || 5);
      const topResults = results.slice(0, 5);

      const contents = await Promise.all(
        topResults.map(async (result) => {
          try {
            const scraped = await scrapeWebsite(result.url);
            return `# ${result.title}\nSource: ${result.url}\n\n${scraped.markdown || scraped.content}`;
          } catch {
            return `# ${result.title}\nSource: ${result.url}\n\n${result.content}`;
          }
        })
      );

      return contents.join("\n\n---\n\n");
    }

    default:
      throw new Error(`Unknown source type: ${source.type}`);
  }
}

export const processSource = {
  async fetchContent(sourceId: string) {
    const source = await sourceRepository.findById(sourceId);
    if (!source) throw new Error(`Source ${sourceId} not found`);

    const content = await fetchSourceContent(source);

    await sourceRepository.update(sourceId, {
      content,
      status: "processing",
    });

    return { contentLength: content.length };
  },

  async chunkContent(sourceId: string, workspaceId: string) {
    const source = await sourceRepository.findById(sourceId);
    if (!source?.content) throw new Error("Source content not found");

    await chunkRepository.deleteBySourceId(sourceId);

    const chunks = recursiveChunk(source.content, {
      chunkSize: 2048,
      chunkOverlap: 200,
    });

    await chunkRepository.createMany(
      chunks.map((chunk) => ({
        sourceId,
        workspaceId,
        index: chunk.index,
        text: chunk.text,
      }))
    );

    return { chunkCount: chunks.length };
  },

  async embedChunks(sourceId: string, workspaceId: string) {
    const chunks = await chunkRepository.findBySourceId(sourceId);
    if (chunks.length === 0) throw new Error("No chunks found");

    const embeddings = await generateEmbeddings(chunks.map((c) => c.text));

    await deleteBySourceId(sourceId);

    const vectors = chunks.map((chunk, idx) => ({
      id: `${sourceId}-${idx}`,
      values: embeddings[idx],
      metadata: {
        sourceId,
        workspaceId,
        chunkIndex: idx,
        text: chunk.text,
      },
    }));

    await upsertChunks(vectors);

    await chunkRepository.deleteBySourceId(sourceId);
    await chunkRepository.createMany(
      chunks.map((chunk) => ({
        sourceId,
        workspaceId,
        index: chunk.index,
        text: chunk.text,
        embedding: JSON.stringify(embeddings[chunk.index]),
      }))
    );

    return { stored: vectors.length };
  },

  async markReady(sourceId: string, chunkCount: number) {
    await sourceRepository.update(sourceId, {
      status: "ready",
      chunkCount,
    });

    return { sourceId };
  },
};
