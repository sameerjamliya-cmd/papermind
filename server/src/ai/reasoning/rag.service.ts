import { expandQuery } from "./query-expansion.service";
import { crag } from "./crag.service";
import { sourceRepository } from "../../repository/source.repository";
import type { CragResult } from "./crag.service";

export interface RagContext {
  chunks: CragResult["chunks"];
  iterations: number;
  sourceTitles: Map<string, string>;
  sourceTypes: Map<string, string>;
}

export async function buildRagContext(
  question: string,
  workspaceId: string,
  history: { role: string; content: string }[] = [],
  maxChunks?: number
): Promise<RagContext> {
  const expansion = await expandQuery(question, history);

  const { chunks, iterations } = await crag(
    question,
    workspaceId,
    expansion.synonyms,
    expansion.stepBack,
    expansion.subQuestions,
    3,
    maxChunks
  );

  const sourceIds = [...new Set(chunks.map((c) => c.sourceId))];
  const sources = await Promise.all(
    sourceIds.map((id) => sourceRepository.findById(id))
  );
  const sourceTitles = new Map<string, string>();
  const sourceTypes = new Map<string, string>();
  for (const s of sources) {
    if (s) {
      sourceTitles.set(s.id, s.title);
      sourceTypes.set(s.id, s.type);
    }
  }

  return { chunks, iterations, sourceTitles, sourceTypes };
}