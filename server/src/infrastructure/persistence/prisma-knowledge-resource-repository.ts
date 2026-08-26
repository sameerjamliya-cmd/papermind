import { prisma } from "../../lib/db";
import type { Prisma } from "../../generated/prisma";
import type {
  KnowledgeResourceRepository,
  UpdateKnowledgeResourceInput,
} from "../../application/ports/knowledge-resource-repository";
import type { KnowledgeResource } from "../../domain/entities/knowledge-resource";
import {
  createResourceId,
  createWorkspaceId,
  createUserId,
  type ResourceId,
} from "../../domain/primitives/brand";
import { ResourceType } from "../../domain/enums/resource-type";
import { KnowledgeResourceStatus } from "../../domain/enums/knowledge-resource-status";
import type { JsonObject } from "../../domain/primitives/json-value";

export class PrismaKnowledgeResourceRepository
  implements KnowledgeResourceRepository
{
  async create(resource: KnowledgeResource): Promise<KnowledgeResource> {
    const created = await prisma.knowledgeResource.create({
      data: {
        id: resource.id,
        workspaceId: resource.workspaceId,
        userId: resource.userId,
        type: resource.type,
        status: resource.status,
        title: resource.title,
        originalUrl: resource.originalUrl,
        publicId: resource.publicId,
        metadata: resource.metadata as Prisma.InputJsonValue,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: ResourceId): Promise<KnowledgeResource | null> {
    const raw = await prisma.knowledgeResource.findUnique({ where: { id } });
    if (!raw) return null;
    return this.toDomain(raw);
  }

  async updateStatus(
    id: ResourceId,
    status: KnowledgeResourceStatus,
    errorMessage?: string
  ): Promise<void> {
    await this.update(id, { status, errorMessage });
  }

  async update(
    id: ResourceId,
    input: UpdateKnowledgeResourceInput
  ): Promise<void> {
    const data: Prisma.KnowledgeResourceUpdateInput = {};
    if (input.status !== undefined) data.status = input.status;
    if (input.chunkCount !== undefined) data.chunkCount = input.chunkCount;
    if (input.errorMessage !== undefined) {
      data.errorMessage = input.errorMessage;
    }
    await prisma.knowledgeResource.update({ where: { id }, data });
  }

  private toDomain(raw: {
    id: string;
    workspaceId: string;
    userId: string;
    type: string;
    status: string;
    title: string;
    originalUrl: string;
    publicId: string;
    metadata: unknown;
    chunkCount: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): KnowledgeResource {
    return {
      id: createResourceId(raw.id),
      workspaceId: createWorkspaceId(raw.workspaceId),
      userId: createUserId(raw.userId),
      type: raw.type as ResourceType,
      status: raw.status as KnowledgeResourceStatus,
      title: raw.title,
      originalUrl: raw.originalUrl,
      publicId: raw.publicId,
      metadata: (raw.metadata as JsonObject) ?? {},
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }
}