import type { ResourceId, WorkspaceId, UserId } from "../primitives/brand";
import type { ResourceType } from "../enums/resource-type";
import type { KnowledgeResourceStatus } from "../enums/knowledge-resource-status";
import type { JsonObject } from "../primitives/json-value";

export interface KnowledgeResource {
  readonly id: ResourceId;
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly type: ResourceType;
  readonly status: KnowledgeResourceStatus;
  readonly title: string;
  readonly originalUrl: string;
  readonly publicId: string;
  readonly metadata: JsonObject;
  readonly createdAt: string; // ISO-8601
  readonly updatedAt: string; // ISO-8601
}