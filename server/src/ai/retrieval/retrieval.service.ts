import { chunkRepository } from "../../repository/chunk.repository";
import { createPineconeRetriever } from "./pinecone-retriever";
import { HybridRetriever } from "./hybrid-retriever";
import type { RetrievedChunk } from "./retrieval-types";

const hybridRetriever = new HybridRetriever({
  retrievers: [createPineconeRetriever()],
});

export async function hybridRetrieval(
  queries: string[],
  keywordTerms: string[],
  workspaceId: string
): Promise<RetrievedChunk[]> {
  const seen = new Set<string>();
  const allChunks: RetrievedChunk[] = [];

  for (const query of queries) {
    const result = await hybridRetriever.retrieve(query, {
      workspaceId,
      topK: 20,
    });

    for (const chunk of result.chunks) {
      if (seen.has(chunk.id)) continue;
      seen.add(chunk.id);
      allChunks.push(chunk);
    }
  }

  // Keyword fallback remains a direct repository call until a KeywordRetriever
  // (e.g. BM25) is implemented and plugged into HybridRetriever.
  if (keywordTerms.length > 0) {
    const keywordResults = await chunkRepository.searchByKeywords(
      workspaceId,
      keywordTerms,
      20
    );
    for (const chunk of keywordResults) {
      if (seen.has(chunk.id)) continue;
      seen.add(chunk.id);
      allChunks.push({
        id: chunk.id,
        text: chunk.text,
        sourceId: chunk.sourceId,
        chunkIndex: chunk.index,
        score: 0.5,
      });
    }
  }

  allChunks.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return allChunks;
}