import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  buildFlashcardsRagContext,
  type FlashcardContextChunk,
} from "./flashcards-rag.service";
import type { Flashcard, FlashcardSourceRef } from "../../types";

const sourceRefSchema = z.object({
  chunkId: z.string().min(1),
  sourceId: z.string().min(1),
  sourceTitle: z.string().min(1),
  snippet: z.string().min(1).max(300),
});

const flashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  hint: z.string().min(1),
  sourceRefs: z.array(sourceRefSchema).max(3),
});

const deckSchema = z.object({
  cards: z.array(flashcardSchema).min(1),
});

function buildSystemPrompt(cardCount: number): string {
  return `You are an expert educator creating flashcards from the provided source material.

Settings:
- Number of cards: ${cardCount}

Guidelines:
- Front should be a concise prompt: a key term, question, concept, or fill-in-the-blank clue that the learner should be able to answer from memory.
- Back should be the answer plus a short explanation (2-4 sentences) that reinforces why it is correct.
- Include a short hint with every card to help the learner recall the answer.
- Cards must be faithful to the provided sources. Do not invent facts.
- Focus on important, memorable concepts — not trivial details.
- Distribute cards across different sources and topics when possible.
- Include 0-3 source references per card using only chunk IDs from the CHUNK INDEX.

Return ONLY valid JSON matching the provided schema.`;
}

function buildContextText(chunks: FlashcardContextChunk[]): string {
  const blocks: string[] = [];
  let currentSection: string | null = null;
  let currentSource: string | null = null;

  chunks.forEach((c, i) => {
    if (currentSource !== c.sourceTitle) {
      currentSource = c.sourceTitle;
      blocks.push(`DOCUMENT: ${c.sourceTitle}`);
      currentSection = null;
    }
    if (currentSection !== c.sectionTitle) {
      currentSection = c.sectionTitle;
      blocks.push(`SECTION: ${c.sectionTitle}`);
    }
    blocks.push(`[CHUNK_${i}] id="${c.id}" source="${c.sourceTitle}"\n${c.text}`);
  });

  return blocks.join("\n\n---\n\n");
}

export async function generateFlashcards(
  workspaceId: string,
  cardCount: number
): Promise<Flashcard[]> {
  const { chunks } = await buildFlashcardsRagContext(workspaceId, cardCount);

  if (chunks.length === 0) {
    throw new Error("Not enough source material to generate flashcards");
  }

  const validChunkIds = new Set(chunks.map((c) => c.id));
  const chunkMap = new Map(
    chunks.map((c) => [
      c.id,
      { id: c.id, text: c.text, sourceId: c.sourceId, sourceTitle: c.sourceTitle },
    ])
  );

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: deckSchema,
    prompt: `${buildSystemPrompt(cardCount)}

CHUNK INDEX (only these IDs are valid):
${chunks.map((c, i) => `[CHUNK_${i}] id="${c.id}" source="${c.sourceTitle}"`).join("\n")}

SOURCE MATERIAL:
${buildContextText(chunks)}

Generate ${cardCount} flashcards as a JSON object with a "cards" array.`,
    temperature: 0.7,
  });

  const enrichedCards: Flashcard[] = object.cards.map((c) => ({
    id: c.id,
    front: c.front,
    back: c.back,
    hint: c.hint,
    sourceRefs: c.sourceRefs
      .filter((s) => validChunkIds.has(s.chunkId))
      .map((s) => {
        const chunk = chunkMap.get(s.chunkId);
        return {
          chunkId: s.chunkId,
          sourceId: chunk?.sourceId ?? s.sourceId,
          sourceTitle: chunk?.sourceTitle ?? s.sourceTitle,
          snippet: s.snippet,
        } as FlashcardSourceRef;
      }),
  }));

  return enrichedCards;
}