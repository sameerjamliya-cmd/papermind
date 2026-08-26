import type { PipelineState } from "../../pipeline/pipeline-state";
import type {
  WorkspaceId,
  UserId,
  ConversationId,
} from "../../../domain/primitives/brand";
import type { Message } from "../../../domain/entities/message";
import type { RetrieverType } from "../../../domain/enums/retriever-type";
import type { ChatEvent } from "./chat-events";

export interface ChatRetrievedChunk {
  readonly id: string;
  readonly text: string;
  readonly sourceId: string;
  readonly sourceTitle: string;
  readonly sourceType: string;
  readonly chunkIndex: number;
  readonly score?: number;
  readonly retrieverType: RetrieverType;
}

export interface ChatState extends PipelineState {
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly conversationId: ConversationId;
  readonly message: string;
  readonly enableWebSearch: boolean;
  readonly progressWriter?: (event: ChatEvent) => void | Promise<void>;
  readonly streamWriter?: (chunk: string) => void | Promise<void>;

  readonly history: readonly Message[];
  readonly longTermMemory: string | null;
  readonly retrievedChunks: readonly ChatRetrievedChunk[];
  readonly rankedChunks: readonly ChatRetrievedChunk[];
  readonly contextText: string;

  readonly textStream?: AsyncIterable<string>;
  readonly response?: string;
  readonly error?: string;
}