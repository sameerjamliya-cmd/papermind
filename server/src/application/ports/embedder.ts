export interface Embedder {
  embed(texts: readonly string[]): Promise<ReadonlyArray<readonly number[]>>;
}