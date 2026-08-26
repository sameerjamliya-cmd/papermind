import type { ChunkId, DocumentId, WorkspaceId } from "../primitives/brand";
import type { ChunkLocation } from "../value-objects/chunk-location";

export interface Chunk {
  readonly id: ChunkId;
  readonly documentId: DocumentId;
  readonly workspaceId: WorkspaceId;
  readonly location: ChunkLocation;
  readonly content: string; // text or serialized representation
  readonly embedding: readonly number[] | null;
  readonly createdAt: string; // ISO-8601
}