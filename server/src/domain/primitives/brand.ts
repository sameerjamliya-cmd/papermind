export type Brand<T, B> = T & { readonly __brand: B };

export type WorkspaceId = Brand<string, "WorkspaceId">;
export type DocumentId = Brand<string, "DocumentId">;
export type ChunkId = Brand<string, "ChunkId">;
export type ConversationId = Brand<string, "ConversationId">;
export type MessageId = Brand<string, "MessageId">;
export type CitationId = Brand<string, "CitationId">;
export type UserId = Brand<string, "UserId">;
export type ResourceId = Brand<string, "ResourceId">;

export function createWorkspaceId(value: string): WorkspaceId {
  return value as WorkspaceId;
}

export function createDocumentId(value: string): DocumentId {
  return value as DocumentId;
}

export function createChunkId(value: string): ChunkId {
  return value as ChunkId;
}

export function createConversationId(value: string): ConversationId {
  return value as ConversationId;
}

export function createMessageId(value: string): MessageId {
  return value as MessageId;
}

export function createCitationId(value: string): CitationId {
  return value as CitationId;
}

export function createUserId(value: string): UserId {
  return value as UserId;
}

export function createResourceId(value: string): ResourceId {
  return value as ResourceId;
}