import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const expansionSchema = z.object({
  stepBack: z.string(),
  synonyms: z.array(z.string()),
  subQuestions: z.array(z.string()),
});

export type QueryExpansion = z.infer<typeof expansionSchema>;

export async function expandQuery(
  question: string,
  history?: { role: string; content: string }[]
): Promise<QueryExpansion> {
  const historyText = history?.length
    ? history
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n")
    : "";

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: expansionSchema,
    prompt: `You are a query expansion engine. Given a user's question, generate:
1. A "step-back" query — a broader, higher-level rephrasing for better recall
2. Synonyms — keyword alternatives for the main concepts
3. Sub-questions — 2-3 smaller questions that together answer the original

${historyText ? `Conversation history:\n${historyText}\n\n` : ""}
User question: "${question}"

Return JSON with stepBack, synonyms, subQuestions.`,
  });

  return object;
}