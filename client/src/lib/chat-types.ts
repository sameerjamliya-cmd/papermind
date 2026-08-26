export interface ChatProgressEvent {
  type: "progress";
  stage:
    | "memory"
    | "retrieval"
    | "reranking"
    | "context-builder"
    | "generation"
    | "streaming";
  status: "started" | "completed";
}

export interface ChatTokenEvent {
  type: "token";
  delta: string;
}

export interface ChatSourcesEvent {
  type: "sources";
  sources: Array<{
    sourceId: string;
    sourceTitle: string;
    sourceType: string;
  }>;
}

export interface ChatErrorEvent {
  type: "error";
  message: string;
}

export type ChatEvent = ChatProgressEvent | ChatTokenEvent | ChatSourcesEvent | ChatErrorEvent;

export interface ChatSourceItem {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: string;
  isStreaming?: boolean;
  sources?: ChatSourceItem[];
}

export const stageStatusMap: Record<ChatProgressEvent["stage"], string> = {
  memory: "🧠 Remembering context...",
  retrieval: "🔍 Searching your library...",
  reranking: "📚 Retrieving relevant knowledge...",
  "context-builder": "🧩 Building context...",
  generation: "✍️ Generating answer...",
  streaming: "💬 Streaming response...",
};