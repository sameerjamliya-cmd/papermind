import { randomUUID } from "node:crypto";
import type { FileStorage } from "../ports/file-storage";
import type { KnowledgeResourceRepository } from "../ports/knowledge-resource-repository";
import type { WorkspaceRepository } from "../ports/workspace-repository";
import type { EventPublisher } from "../ports/event-publisher";
import type { ResourceType } from "../../domain/enums/resource-type";
import { KnowledgeResourceStatus } from "../../domain/enums/knowledge-resource-status";
import type { KnowledgeResource } from "../../domain/entities/knowledge-resource";
import {
  createResourceId,
  createWorkspaceId,
  createUserId,
  type WorkspaceId,
  type UserId,
} from "../../domain/primitives/brand";
import { NotFoundError, ForbiddenError } from "../../types/app-error";

export interface UploadFileInput {
  readonly buffer: Buffer;
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
}

export interface UploadKnowledgeResourceInput {
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly title: string;
  readonly type: ResourceType;
  readonly file: UploadFileInput;
}

export class UploadKnowledgeResourceUseCase {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly knowledgeResourceRepository: KnowledgeResourceRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(
    input: UploadKnowledgeResourceInput
  ): Promise<KnowledgeResource> {
    const workspace = await this.workspaceRepository.findById(
      input.workspaceId
    );
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }
    if (workspace.userId !== input.userId) {
      throw new ForbiddenError();
    }

    const uploaded = await this.fileStorage.upload({
      buffer: input.file.buffer,
      filename: input.file.filename,
      mimeType: input.file.mimeType,
      resourceType: input.type,
    });

    const now = new Date().toISOString();

    const resource: KnowledgeResource = {
      id: createResourceId(randomUUID()),
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: input.type,
      status: KnowledgeResourceStatus.Uploaded,
      title: input.title,
      originalUrl: uploaded.url,
      publicId: uploaded.publicId,
      metadata: {
        filename: input.file.filename,
        mimeType: input.file.mimeType,
        size: input.file.size,
      },
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.knowledgeResourceRepository.create(resource);

    await this.eventPublisher.publish({
      name: "knowledge-resource.created",
      data: {
        resourceId: created.id,
        workspaceId: created.workspaceId,
      },
    });

    return created;
  }
}