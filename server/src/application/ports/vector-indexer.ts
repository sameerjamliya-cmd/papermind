import type { ResourceId, WorkspaceId } from "../../domain/primitives/brand";

export interface VectorIndexerChunk {
  readonly index: number;
  readonly text: string;
  readonly embedding: readonly number[];
}

export interface VectorIndexerInput {
  readonly resourceId: ResourceId;
  readonly workspaceId: WorkspaceId;
  readonly chunks: readonly VectorIndexerChunk[];
}

export interface VectorIndexer {
  index(input: VectorIndexerInput): Promise<void>;
}