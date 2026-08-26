import type {
  ChunkId,
  ResourceId,
  WorkspaceId,
} from "../../domain/primitives/brand";

export interface KnowledgeResourceChunk {
  readonly id: ChunkId;
  readonly resourceId: ResourceId;
  readonly workspaceId: WorkspaceId;
  readonly index: number;
  readonly text: string;
  readonly embedding: readonly number[] | null;
  readonly createdAt: string;
}

export interface CreateKnowledgeResourceChunkInput {
  readonly resourceId: ResourceId;
  readonly workspaceId: WorkspaceId;
  readonly index: number;
  readonly text: string;
  readonly embedding: readonly number[] | null;
}

export interface KnowledgeResourceChunkRepository {
  createMany(
    chunks: readonly CreateKnowledgeResourceChunkInput[]
  ): Promise<KnowledgeResourceChunk[]>;
}