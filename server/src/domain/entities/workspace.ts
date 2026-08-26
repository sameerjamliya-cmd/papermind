import type { UserId, WorkspaceId } from "../primitives/brand";

export interface Workspace {
  readonly id: WorkspaceId;
  readonly userId: UserId;
  readonly title: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly chatModel: string;
  readonly createdAt: string; // ISO-8601
  readonly updatedAt: string; // ISO-8601
}