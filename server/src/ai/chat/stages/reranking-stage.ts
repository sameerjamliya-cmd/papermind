import type { PipelineStage } from "../../pipeline/pipeline-stage";
import type { ChatState, ChatRetrievedChunk } from "../types/chat-state";
import { postProcess } from "../../../ai/retrieval/post-processing.service";
import { RetrieverType } from "../../../domain/enums/retriever-type";
import { withProgress } from "./stage-utils";

export class RerankingStage implements PipelineStage<ChatState> {
  readonly name = "reranking";

  async execute(state: ChatState): Promise<ChatState> {
    return withProgress(state, "reranking", async () => {
      if (state.retrievedChunks.length === 0) {
        return { ...state, rankedChunks: [] };
      }

      const candidates = state.retrievedChunks.map((chunk) => ({
        id: chunk.id,
        text: chunk.text,
        sourceId: chunk.sourceId,
        chunkIndex: chunk.chunkIndex,
        score: chunk.score,
      }));

      const ranked = await postProcess(state.message, candidates);

      const rankedChunks: ChatRetrievedChunk[] = ranked.map((candidate) => {
        const original = state.retrievedChunks.find(
          (c) => c.id === candidate.id
        );
        return {
          id: candidate.id,
          text: candidate.text,
          sourceId: candidate.sourceId,
          sourceTitle: original?.sourceTitle ?? "",
          sourceType: original?.sourceType ?? "unknown",
          chunkIndex: candidate.chunkIndex,
          score: candidate.score,
          retrieverType: original?.retrieverType ?? RetrieverType.Vector,
        };
      });

      return { ...state, rankedChunks };
    });
  }
}