import type { UserId, WorkspaceId, DocumentId } from "../primitives/brand";
import type { DocumentMetadata } from "../value-objects/document-metadata";
import type { DocumentStatus } from "../enums/document-status";

export interface Document {
  readonly id: DocumentId;
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly metadata: DocumentMetadata;
  readonly status: DocumentStatus;
  readonly content: string | null; // extracted text / transcript / markdown
  readonly fileUrl: string | null;
  readonly errorMessage: string | null;
  readonly chunkCount: number | null;
  readonly createdAt: string; // ISO-8601
  readonly updatedAt: string; // ISO-8601
}