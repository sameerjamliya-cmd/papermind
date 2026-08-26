export type ChatEventType = "progress" | "token" | "error" | "sources";

export interface ChatProgressEvent {
  readonly type: "progress";
  readonly stage:
    | "memory"
    | "retrieval"
    | "reranking"
    | "context-builder"
    | "generation"
    | "streaming";
  readonly status: "started" | "completed";
}

export interface ChatTokenEvent {
  readonly type: "token";
  readonly delta: string;
}

export interface ChatSourceItem {
  readonly sourceId: string;
  readonly sourceTitle: string;
  readonly sourceType: string;
}

export interface ChatSourcesEvent {
  readonly type: "sources";
  readonly sources: readonly ChatSourceItem[];
}

export interface ChatErrorEvent {
  readonly type: "error";
  readonly message: string;
}

export type ChatEvent = ChatProgressEvent | ChatTokenEvent | ChatSourcesEvent | ChatErrorEvent;

export function serializeChatEvent(event: ChatEvent): string {
  return JSON.stringify(event);
}