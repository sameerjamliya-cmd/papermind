import type { Embedder } from "../../application/ports/embedder";
import { generateEmbeddings } from "../../ai/orchestrator/openai";

export class OpenAIEmbedder implements Embedder {
  async embed(
    texts: readonly string[]
  ): Promise<ReadonlyArray<readonly number[]>> {
    return generateEmbeddings([...texts]);
  }
}