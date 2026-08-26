import type {
  UserId,
  WorkspaceId,
  ConversationId,
  MessageId,
} from "../primitives/brand";
import type { MessageRole } from "../enums/message-role";
import type { Citation } from "./citation";

export interface Message {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly role: MessageRole;
  readonly content: string;
  readonly citations: readonly Citation[];
  readonly createdAt: string; // ISO-8601
}