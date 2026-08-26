import { prisma } from "../../lib/db";
import type {
  KnowledgeResourceChunkRepository,
  CreateKnowledgeResourceChunkInput,
  KnowledgeResourceChunk,
} from "../../application/ports/knowledge-resource-chunk-repository";
import {
  createChunkId,
  createResourceId,
  createWorkspaceId,
} from "../../domain/primitives/brand";

export class PrismaKnowledgeResourceChunkRepository
  implements KnowledgeResourceChunkRepository
{
  async createMany(
    chunks: readonly CreateKnowledgeResourceChunkInput[]
  ): Promise<KnowledgeResourceChunk[]> {
    const created = await prisma.knowledgeResourceChunk.createManyAndReturn({
      data: chunks.map((chunk) => ({
        resourceId: chunk.resourceId,
        workspaceId: chunk.workspaceId,
        index: chunk.index,
        text: chunk.text,
        embedding:
          chunk.embedding === null
            ? null
            : JSON.stringify([...chunk.embedding]),
      })),
    });

    return created.map((raw) => ({
      id: createChunkId(raw.id),
      resourceId: createResourceId(raw.resourceId),
      workspaceId: createWorkspaceId(raw.workspaceId),
      index: raw.index,
      text: raw.text,
      embedding: raw.embedding
        ? (JSON.parse(raw.embedding) as number[])
        : null,
      createdAt: raw.createdAt.toISOString(),
    }));
  }
}