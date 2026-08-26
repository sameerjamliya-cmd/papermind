import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { ChatState } from "../types/chat-state";
import type { MessageRepository } from "../../../application/ports/message-repository";
import type { MemoryStore } from "../../../application/ports/memory-store";
import { MessageRole } from "../../../domain/enums/message-role";
import { withProgress } from "./stage-utils";

export class MemoryStage implements PipelineStage<ChatState> {
  readonly name = "memory";

  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly memoryStore: MemoryStore,
    private readonly historyLimit: number = 20
  ) {}

  async execute(state: ChatState): Promise<ChatState> {
    return withProgress(state, "memory", async () => {
      const [history, longTermMemory] = await Promise.all([
        this.messageRepository.findByWorkspace(
          state.workspaceId,
          this.historyLimit
        ),
        this.memoryStore.getLatest(state.userId),
      ]);

      await this.messageRepository.create({
        workspaceId: state.workspaceId,
        userId: state.userId,
        role: MessageRole.User,
        content: state.message,
      });

      return { ...state, history, longTermMemory };
    });
  }
}