export interface RetrievedChunk {
  readonly id: string;
  readonly text: string;
  readonly sourceId: string;
  readonly chunkIndex: number;
  readonly score?: number;
}

export interface RetrievalResult {
  readonly chunks: readonly RetrievedChunk[];
}

export interface RetrieveOptions {
  readonly workspaceId: string;
  readonly topK?: number;
}
