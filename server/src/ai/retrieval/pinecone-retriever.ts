import type { Retriever } from "./retriever";
import type {
  RetrievedChunk,
  RetrievalResult,
  RetrieveOptions,
} from "./retrieval-types";
import type { querySimilar as querySimilarFn } from "./pinecone";
import type { generateEmbeddings as generateEmbeddingsFn } from "../orchestrator/openai";
import { generateEmbeddings } from "../orchestrator/openai";
import { querySimilar } from "./pinecone";

export interface PineconeRetrieverDependencies {
  readonly generateEmbeddings: typeof generateEmbeddingsFn;
  readonly querySimilar: typeof querySimilarFn;
}

export class PineconeRetriever implements Retriever {
  readonly name = "pinecone";

  constructor(private readonly deps: PineconeRetrieverDependencies) {}

  async retrieve(
    query: string,
    options: RetrieveOptions
  ): Promise<RetrievalResult> {
    const [embedding] = await this.deps.generateEmbeddings([query]);

    const matches = await this.deps.querySimilar(
      embedding,
      options.topK ?? 20,
      options.workspaceId
    );

    const chunks: RetrievedChunk[] = matches.map((match) => {
      const metadata = match.metadata ?? {};
      return {
        id: (match.id as string) ?? "",
        text: (metadata.text as string) ?? "",
        sourceId:
          (metadata.sourceId as string) || (metadata.resourceId as string) || "",
        chunkIndex: (metadata.chunkIndex as number) ?? 0,
        score: match.score,
      };
    });

    return { chunks };
  }
}

export function createPineconeRetriever(): PineconeRetriever {
  return new PineconeRetriever({ generateEmbeddings, querySimilar });
}
