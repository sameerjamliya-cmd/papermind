import type { RetrievalResult, RetrieveOptions } from "./retrieval-types";

export interface Retriever {
  readonly name: string;
  retrieve(query: string, options: RetrieveOptions): Promise<RetrievalResult>;
}