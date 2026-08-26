import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { hybridRetrieval } from "../retrieval/retrieval.service";
import { postProcess } from "../retrieval/post-processing.service";

const evaluationSchema = z.object({
  sufficient: z.boolean(),
  missingInfo: z.string(),
  rewrittenQuery: z.string(),
});

export interface CragResult {
  chunks: Array<{
    id: string;
    text: string;
    sourceId: string;
    chunkIndex: number;
    score?: number;
  }>;
  iterations: number;
  sufficient: boolean;
}

export async function crag(
  question: string,
  workspaceId: string,
  synonyms: string[],
  stepBack?: string,
  subQuestions?: string[],
  maxIterations = 3,
  maxChunks = 5
): Promise<CragResult> {
  const initialQueries = [question];
  if (stepBack) initialQueries.push(stepBack);
  if (subQuestions) initialQueries.push(...subQuestions.slice(0, 2));

  let chunks = await hybridRetrieval(initialQueries, synonyms, workspaceId);
  chunks = await postProcess(question, chunks, maxChunks);

  for (let i = 1; i <= maxIterations; i++) {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: evaluationSchema,
      prompt: `Evaluate whether the retrieved chunks are sufficient to answer the question.

Question: "${question}"

Retrieved chunks:
${chunks.map((c, idx) => `[${idx}] ${c.text.slice(0, 400)}`).join("\n\n")}

Are these chunks sufficient? If not, what's missing and how should we rewrite the query to find it?`,
    });

    if (object.sufficient) {
      return { chunks, iterations: i, sufficient: true };
    }

    if (!object.rewrittenQuery) {
      return { chunks, iterations: i, sufficient: false };
    }

    const newChunks = await hybridRetrieval(
      [object.rewrittenQuery],
      [],
      workspaceId
    );
    const processed = await postProcess(question, newChunks, maxChunks);

    chunks = [...chunks, ...processed];
    const seen = new Set<string>();
    chunks = chunks.filter((c) => {
      const key = c.text.slice(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    chunks.sort((a, b) => (b.score || 0) - (a.score || 0));
    chunks = chunks.slice(0, maxChunks);
  }

  return { chunks, iterations: maxIterations, sufficient: false };
}