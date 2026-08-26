import type { Chunk } from "./chunk";
import type { RetrieverType } from "../enums/retriever-type";

export interface RetrievedChunk {
  readonly chunk: Chunk;
  readonly score: number;
  readonly retrieverType: RetrieverType;
}