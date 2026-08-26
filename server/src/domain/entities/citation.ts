import type {
  DocumentId,
  ChunkId,
  MessageId,
  CitationId,
} from "../primitives/brand";
import type { ChunkLocation } from "../value-objects/chunk-location";

export interface Citation {
  readonly id: CitationId;
  readonly messageId: MessageId;
  readonly documentId: DocumentId;
  readonly chunkId: ChunkId;
  readonly excerpt: string;
  readonly location: ChunkLocation;
}