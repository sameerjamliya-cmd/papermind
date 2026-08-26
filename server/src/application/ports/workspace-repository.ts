import type { Workspace, WorkspaceId } from "../../domain";

export interface WorkspaceRepository {
  findById(id: WorkspaceId): Promise<Workspace | null>;
}