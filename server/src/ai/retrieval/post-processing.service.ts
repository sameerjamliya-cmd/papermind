import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { deduplicate } from "./deduplicate";

interface ChunkCandidate {
  id: string;
  text: string;
  sourceId: string;
  chunkIndex: number;
  score?: number;
}

const rerankSchema = z.object({
  rankings: z.array(
    z.object({
      index: z.number(),
      relevance: z.number().min(1).max(10),
    })
  ),
});

export async function postProcess(
  question: string,
  candidates: ChunkCandidate[],
  maxChunks = 5
): Promise<ChunkCandidate[]> {
  const deduped = deduplicate(candidates);

  if (deduped.length <= maxChunks) return deduped;

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: rerankSchema,
    prompt: `Rate each chunk's relevance to the question on a scale of 1-10. Return the indices of the top ${maxChunks} most relevant.

Question: "${question}"

Chunks:
${deduped.map((c, i) => `[${i}] ${c.text.slice(0, 500)}`).join("\n\n")}`,
  });

  const scored = deduped.map((chunk, i) => {
    const rank = object.rankings.find((r) => r.index === i);
    return { ...chunk, score: rank ? rank.relevance : 0 };
  });

  return scored
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, maxChunks);
}