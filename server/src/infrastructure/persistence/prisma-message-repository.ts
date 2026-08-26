import { prisma } from "../../lib/db";
import type { MessageRepository } from "../../application/ports/message-repository";
import type { Message, WorkspaceId } from "../../domain";
import {
  createMessageId,
  createWorkspaceId,
  createUserId,
  createConversationId,
} from "../../domain/primitives/brand";
import { MessageRole } from "../../domain/enums/message-role";

export class PrismaMessageRepository implements MessageRepository {
  async findByWorkspace(
    workspaceId: WorkspaceId,
    limit: number
  ): Promise<Message[]> {
    const messages = await prisma.message.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.reverse().map((raw) => this.toDomain(raw));
  }

  async findByWorkspaceAfterId(
    workspaceId: WorkspaceId,
    afterId: string | null,
    limit: number
  ): Promise<Message[]> {
    const afterMessage = afterId
      ? await prisma.message.findUnique({ where: { id: afterId } })
      : null;

    const messages = await prisma.message.findMany({
      where: {
        workspaceId,
        ...(afterMessage
          ? { createdAt: { gt: afterMessage.createdAt } }
          : {}),
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return messages.map((raw) => this.toDomain(raw));
  }

  async create(message: {
    workspaceId: WorkspaceId;
    userId: string;
    role: string;
    content: string;
  }): Promise<Message> {
    const created = await prisma.message.create({
      data: {
        workspaceId: message.workspaceId,
        userId: message.userId,
        role: message.role,
        content: message.content,
      },
    });

    return this.toDomain(created);
  }

  private toDomain(raw: {
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
    content: string;
    citations: unknown;
    createdAt: Date;
  }): Message {
    return {
      id: createMessageId(raw.id),
      conversationId: createConversationId(raw.workspaceId),
      workspaceId: createWorkspaceId(raw.workspaceId),
      userId: createUserId(raw.userId),
      role: raw.role as MessageRole,
      content: raw.content,
      citations: [],
      createdAt: raw.createdAt.toISOString(),
    };
  }
}