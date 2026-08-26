import type { DocumentId } from "../primitives/brand";

export interface ChunkLocation {
  readonly documentId: DocumentId;
  readonly chunkIndex: number;
  readonly pageNumber?: number;
  readonly startOffset?: number;
  readonly endOffset?: number;
  readonly startTime?: number; // seconds, for audio/video
  readonly endTime?: number;
  readonly boundingBox?: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly path?: string; // e.g. "chapter-1/section-2"
}