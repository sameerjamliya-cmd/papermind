import type { KnowledgeResource } from "../../domain/entities/knowledge-resource";
import type { ResourceId } from "../../domain/primitives/brand";
import type { KnowledgeResourceStatus } from "../../domain/enums/knowledge-resource-status";

export interface UpdateKnowledgeResourceInput {
  readonly status?: KnowledgeResourceStatus;
  readonly chunkCount?: number;
  readonly errorMessage?: string | null;
}

export interface KnowledgeResourceRepository {
  create(resource: KnowledgeResource): Promise<KnowledgeResource>;
  findById(id: ResourceId): Promise<KnowledgeResource | null>;
  updateStatus(
    id: ResourceId,
    status: KnowledgeResourceStatus,
    errorMessage?: string
  ): Promise<void>;
  update(id: ResourceId, input: UpdateKnowledgeResourceInput): Promise<void>;
}