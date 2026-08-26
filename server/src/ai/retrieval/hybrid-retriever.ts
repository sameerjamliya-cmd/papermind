import type { Retriever } from "./retriever";
import type {
  RetrievedChunk,
  RetrievalResult,
  RetrieveOptions,
} from "./retrieval-types";

export interface HybridRetrieverOptions {
  readonly retrievers: readonly Retriever[];
}

export class HybridRetriever implements Retriever {
  readonly name = "hybrid";

  constructor(private readonly options: HybridRetrieverOptions) {}

  async retrieve(
    query: string,
    options: RetrieveOptions
  ): Promise<RetrievalResult> {
    const results = await Promise.all(
      this.options.retrievers.map((retriever) =>
        retriever.retrieve(query, options)
      )
    );

    return this.merge(results);
  }

  private merge(results: RetrievalResult[]): RetrievalResult {
    const bestById = new Map<string, RetrievedChunk>();

    for (const result of results) {
      for (const chunk of result.chunks) {
        const existing = bestById.get(chunk.id);
        if (
          !existing ||
          (chunk.score ?? 0) > (existing.score ?? 0)
        ) {
          bestById.set(chunk.id, chunk);
        }
      }
    }

    const chunks = [...bestById.values()].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );

    return { chunks };
  }
}