import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { AUDIO_MODE_CONFIG } from "../../config/audio-modes";
import { expandQuery } from "../reasoning/query-expansion.service";
import { hybridRetrieval } from "../retrieval/retrieval.service";
import { sourceRepository } from "../../repository/source.repository";
import type { RagContext } from "../reasoning/rag.service";
import type { RetrievedChunk } from "../retrieval/retrieval-types";

const qualitySchema = z.object({
  relevance: z.number().min(1).max(10),
  coverage: z.number().min(1).max(10),
  redundancy: z.number().min(1).max(10),
  sourceCompleteness: z.number().min(1).max(10),
  sufficient: z.boolean(),
  improvedQuery: z.string(),
});

interface ContextQuality {
  relevance: number;
  coverage: number;
  redundancy: number;
  sourceCompleteness: number;
  sufficient: boolean;
  improvedQuery: string;
}

export interface BuildAudioRagContextOptions {
  workspaceId: string;
  sourceTitle?: string;
  maxAttempts?: number;
}

export function deduplicateChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<string>();
  return chunks.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

async function evaluateContextQuality(
  query: string,
  chunks: RetrievedChunk[]
): Promise<ContextQuality> {
  const chunkText = chunks
    .slice(0, 12)
    .map((c, i) => `[${i}] ${c.text.slice(0, 400)}`)
    .join("\n\n");

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: qualitySchema,
    prompt: `You are evaluating retrieved context for a 6-8 minute educational audio explanation.

Teaching goal: Explain the main concepts of this material with useful examples for a general listener.

Evaluate the retrieved chunks below on:
- relevance: how relevant are they to the teaching goal?
- coverage: do they cover enough breadth and depth for a 6-8 minute audio?
- redundancy: is there excessive duplication? (higher score = less redundancy)
- sourceCompleteness: are multiple relevant sources/documents represented if available?
- sufficient: is the context overall good enough to generate the audio?
- improvedQuery: if insufficient, suggest a better search query to find missing material.

Retrieved chunks:
${chunkText}

Return JSON with the six fields.`,
  });

  return object;
}

async function resolveSourceMetadata(
  chunks: RetrievedChunk[]
): Promise<{ sourceTitles: Map<string, string>; sourceTypes: Map<string, string> }> {
  const sourceIds = [...new Set(chunks.map((c) => c.sourceId).filter(Boolean))];
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

  return { sourceTitles, sourceTypes };
}

export function assembleCoherentContext(chunks: RetrievedChunk[]): RetrievedChunk[] {
  // Sort by source, then by chunk index to reconstruct document flow.
  return [...chunks].sort((a, b) => {
    if (a.sourceId !== b.sourceId) {
      return a.sourceId.localeCompare(b.sourceId);
    }
    return a.chunkIndex - b.chunkIndex;
  });
}

async function retrieveCandidates(
  query: string,
  workspaceId: string,
  maxChunks: number,
  sourceTitle?: string
): Promise<RetrievedChunk[]> {
  const expansion = await expandQuery(query);

  const queries = [query];
  if (expansion.stepBack) queries.push(expansion.stepBack);
  if (expansion.subQuestions?.length) {
    queries.push(...expansion.subQuestions.slice(0, 2));
  }

  const candidates = await hybridRetrieval(queries, expansion.synonyms, workspaceId);

  let unique = deduplicateChunks(candidates);

  // Apply source-title filter after resolving sources if needed.
  if (sourceTitle) {
    const { sourceTitles } = await resolveSourceMetadata(unique);
    unique = unique.filter(
      (c) => (sourceTitles.get(c.sourceId) ?? "").toLowerCase() === sourceTitle.toLowerCase()
    );
  }

  // Sort by score first so the top chunks are the most relevant, then assemble.
  unique.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = unique.slice(0, maxChunks);

  return assembleCoherentContext(top);
}

export async function buildAudioRagContext(
  options: BuildAudioRagContextOptions
): Promise<RagContext> {
  const { workspaceId, sourceTitle, maxAttempts = 3 } = options;
  const config = AUDIO_MODE_CONFIG;

  const baseQuery =
    "Explain the main concepts of this material and include useful examples for a general listener.";
  let currentQuery = baseQuery;
  let allChunks: RetrievedChunk[] = [];
  let lastQuality: ContextQuality | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidates = await retrieveCandidates(
      currentQuery,
      workspaceId,
      config.maxChunks,
      sourceTitle
    );

    // Merge with previous attempts, deduplicate.
    allChunks = deduplicateChunks([...allChunks, ...candidates]);

    // Re-assemble and truncate after merging.
    allChunks = assembleCoherentContext(allChunks).slice(0, config.maxChunks);

    const quality = await evaluateContextQuality(currentQuery, allChunks);
    lastQuality = quality;

    console.log("[audio-rag] attempt", attempt, "chunks:", allChunks.length, "quality:", {
      relevance: quality.relevance,
      coverage: quality.coverage,
      redundancy: quality.redundancy,
      sourceCompleteness: quality.sourceCompleteness,
      sufficient: quality.sufficient,
    });

    if (quality.sufficient || attempt === maxAttempts) {
      break;
    }

    if (quality.improvedQuery && quality.improvedQuery.trim()) {
      currentQuery = quality.improvedQuery;
    } else {
      // If no improved query, broaden the search.
      currentQuery = `${baseQuery} Include additional background, examples, and edge cases.`;
    }
  }

  const { sourceTitles, sourceTypes } = await resolveSourceMetadata(allChunks);

  return {
    chunks: allChunks,
    iterations: maxAttempts,
    sourceTitles,
    sourceTypes,
  };
}
