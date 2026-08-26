import type { UserId, WorkspaceId, ConversationId } from "../primitives/brand";

export interface Conversation {
  readonly id: ConversationId;
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly title: string | null;
  readonly createdAt: string; // ISO-8601
  readonly updatedAt: string; // ISO-8601
}