import { sourceRepository } from "../../repository/source.repository";
import { hybridRetrieval } from "../retrieval/retrieval.service";
import { postProcess } from "../retrieval/post-processing.service";
import type { QuizDifficulty } from "../../types";

export interface QuizContextChunk {
  id: string;
  text: string;
  sourceId: string;
  sourceTitle: string;
  chunkIndex: number;
  score?: number;
}

export interface QuizRagContext {
  chunks: QuizContextChunk[];
  sourceTitles: Map<string, string>;
}

function buildQuizQueries(sourceTitles: string[], difficulty: QuizDifficulty): string[] {
  const baseQueries = [
    "key concepts definitions and terminology",
    "important findings results and conclusions",
    "specific examples applications and case studies",
    "comparisons relationships and connections between ideas",
    "numbers dates measurements and quantitative facts",
    "methods processes mechanisms and how things work",
    "causes effects problems and implications",
  ];

  if (difficulty === "hard") {
    baseQueries.push(
      "edge cases limitations caveats and exceptions",
      "underlying assumptions theoretical frameworks and nuances"
    );
  }

  const perSourceQueries = sourceTitles.flatMap((title) => [
    `key ideas and facts from ${title}`,
    `important details examples and definitions in ${title}`,
  ]);

  return [...baseQueries, ...perSourceQueries];
}

export async function buildQuizRagContext(
  workspaceId: string,
  difficulty: QuizDifficulty,
  questionCount: number
): Promise<QuizRagContext> {
  const sources = await sourceRepository.findAllByWorkspace(workspaceId, {
    page: 1,
    limit: 1000,
  });

  if (sources.sources.length === 0) {
    throw new Error("No sources found in this workspace");
  }

  const sourceTitles = new Map<string, string>();
  for (const s of sources.sources) {
    sourceTitles.set(s.id, s.title);
  }

  const titles = sources.sources.map((s) => s.title);
  const queries = buildQuizQueries(titles, difficulty);

  const maxChunks = Math.max(20, questionCount * 4);

  let allChunks: QuizContextChunk[] = [];
  for (const query of queries) {
    const retrieved = await hybridRetrieval([query], [], workspaceId);
    const processed = await postProcess(query, retrieved, 8);
    for (const c of processed) {
      allChunks.push({
        id: c.id,
        text: c.text,
        sourceId: c.sourceId,
        sourceTitle: sourceTitles.get(c.sourceId) ?? "Unknown",
        chunkIndex: c.chunkIndex,
        score: c.score,
      });
    }
  }

  // Deduplicate by chunk id.
  const seen = new Set<string>();
  allChunks = allChunks.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  // Boost diversity: ensure we have chunks from as many sources as possible.
  const sourceCounts = new Map<string, number>();
  allChunks.sort((a, b) => {
    const countA = sourceCounts.get(a.sourceId) ?? 0;
    const countB = sourceCounts.get(b.sourceId) ?? 0;
    if (countA !== countB) return countA - countB;
    return (b.score ?? 0) - (a.score ?? 0);
  });

  const selected: QuizContextChunk[] = [];
  for (const c of allChunks) {
    if (selected.length >= maxChunks) break;
    selected.push(c);
    sourceCounts.set(c.sourceId, (sourceCounts.get(c.sourceId) ?? 0) + 1);
  }

  // Final sort by source then chunk index for coherent reading.
  selected.sort((a, b) => {
    if (a.sourceId !== b.sourceId) {
      return a.sourceId.localeCompare(b.sourceId);
    }
    return a.chunkIndex - b.chunkIndex;
  });

  return { chunks: selected, sourceTitles };
}
