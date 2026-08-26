import type { Message, WorkspaceId } from "../../domain";

export interface MessageRepository {
  findByWorkspace(workspaceId: WorkspaceId, limit: number): Promise<Message[]>;
  findByWorkspaceAfterId(
    workspaceId: WorkspaceId,
    afterId: string | null,
    limit: number
  ): Promise<Message[]>;
  create(message: {
    workspaceId: WorkspaceId;
    userId: string;
    role: string;
    content: string;
  }): Promise<Message>;
}