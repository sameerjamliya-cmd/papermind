import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { ChatState, ChatRetrievedChunk } from "../types/chat-state";
import { buildRagContext } from "../../../ai/reasoning/rag.service";
import type { WebSearcher } from "../../../application/ports/web-searcher";
import { RetrieverType } from "../../../domain/enums/retriever-type";
import { withProgress } from "./stage-utils";

export class RetrievalStage implements PipelineStage<ChatState> {
  readonly name = "retrieval";

  constructor(private readonly webSearcher: WebSearcher) {}

  async execute(state: ChatState): Promise<ChatState> {
    return withProgress(state, "retrieval", async () => {
      const historyForRag = state.history.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const documentContext = await buildRagContext(
        state.message,
        state.workspaceId,
        historyForRag
      );

      const chunks: ChatRetrievedChunk[] = documentContext.chunks.map(
        (chunk) => ({
          id: chunk.id,
          text: chunk.text,
          sourceId: chunk.sourceId,
          sourceTitle: documentContext.sourceTitles.get(chunk.sourceId) ?? "",
          sourceType: documentContext.sourceTypes.get(chunk.sourceId) ?? "unknown",
          chunkIndex: chunk.chunkIndex,
          score: chunk.score,
          retrieverType: RetrieverType.Vector,
        })
      );

      if (state.enableWebSearch) {
        const webResults = await this.webSearcher.search(state.message, 5);
        const webChunks: ChatRetrievedChunk[] = webResults.map(
          (result, index) => ({
            id: `web-${index}`,
            text: `# ${result.title}\nSource: ${result.url}\n\n${result.content}`,
            sourceId: `web-${index}`,
            sourceTitle: result.title,
            sourceType: "url",
            chunkIndex: index,
            score: 0.5,
            retrieverType: RetrieverType.Keyword,
          })
        );
        chunks.push(...webChunks);
      }

      const sourceMap = new Map<string, { sourceId: string; sourceTitle: string; sourceType: string }>();
      for (const c of chunks) {
        if (!sourceMap.has(c.sourceId)) {
          sourceMap.set(c.sourceId, {
            sourceId: c.sourceId,
            sourceTitle: c.sourceTitle,
            sourceType: c.sourceType,
          });
        }
      }

      await state.progressWriter?.({
        type: "sources",
        sources: [...sourceMap.values()],
      });

      return { ...state, retrievedChunks: chunks };
    });
  }
}