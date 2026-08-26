import { Pipeline } from "../../pipeline";
import type { ChatState } from "../types/chat-state";
import { MemoryStage } from "../stages/memory-stage";
import { RetrievalStage } from "../stages/retrieval-stage";
import { RerankingStage } from "../stages/reranking-stage";
import { ContextBuilderStage } from "../stages/context-builder-stage";
import { GenerationStage } from "../stages/generation-stage";
import { StreamingStage } from "../stages/streaming-stage";
import type { MessageRepository } from "../../../application/ports/message-repository";
import type { WebSearcher } from "../../../application/ports/web-searcher";
import type { MemoryStore } from "../../../application/ports/memory-store";

export interface ChatPipelineDependencies {
  readonly messageRepository: MessageRepository;
  readonly webSearcher: WebSearcher;
  readonly memoryStore: MemoryStore;
}

export class ChatPipeline {
  private readonly pipeline: Pipeline<ChatState>;

  constructor(deps: ChatPipelineDependencies) {
    this.pipeline = new Pipeline<ChatState>()
      .use(new MemoryStage(deps.messageRepository, deps.memoryStore))
      .use(new RetrievalStage(deps.webSearcher))
      .use(new RerankingStage())
      .use(new ContextBuilderStage())
      .use(new GenerationStage())
      .use(new StreamingStage());
  }

  async run(initialState: ChatState) {
    return this.pipeline.run(initialState);
  }
}