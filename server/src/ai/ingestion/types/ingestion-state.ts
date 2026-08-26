import type { PipelineState } from "../../pipeline/pipeline-state";
import type {
  ResourceId,
  WorkspaceId,
  UserId,
} from "../../../domain/primitives/brand";
import type { ResourceType } from "../../../domain/enums/resource-type";
import type { KnowledgeResourceStatus } from "../../../domain/enums/knowledge-resource-status";
import type { IngestionChunk } from "./ingestion-chunk";
import type { JsonObject } from "../../../domain/primitives/json-value";

export interface IngestionState extends PipelineState {
  readonly resourceId: ResourceId;
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly title: string;
  readonly type: ResourceType;
  readonly originalUrl: string;
  readonly publicId: string;
  readonly metadata: JsonObject;
  readonly status: KnowledgeResourceStatus;
  readonly content: string | null;
  readonly normalizedContent: string | null;
  readonly chunks: readonly IngestionChunk[];
  readonly embeddings: ReadonlyArray<readonly number[]> | null;
  readonly error: string | null;
}