import { sourceRepository } from "../../repository/source.repository";
import { chunkRepository } from "../../repository/chunk.repository";
import { hybridRetrieval } from "../retrieval/retrieval.service";
import { deduplicate } from "../retrieval/deduplicate";
import {
  chunkKey,
  budgetForCards,
  structureSource,
  selectRepresentativeChunks,
  computeImportance,
  sortChunksInDocumentOrder,
  type ScopedSource,
  type ScopedChunk,
  type CoverageChunk,
  type StructuredSource,
} from "../retrieval/coverage-selection";

export interface FlashcardContextChunk extends CoverageChunk {
  sourceTitle: string;
}

export interface FlashcardSection {
  sourceId: string;
  sourceTitle: string;
  title: string;
  chunkIds: string[];
}

export interface FlashcardRagContext {
  chunks: FlashcardContextChunk[];
  sections: FlashcardSection[];
  sourceTitles: Map<string, string>;
}

function buildFlashcardQueries(sourceTitles: string[]): string[] {
  const baseQueries = [
    "key concepts definitions and terminology",
    "important facts names dates and figures",
    "core ideas principles and rules",
    "relationships comparisons and connections between ideas",
    "causes effects and implications",
    "specific examples applications and case studies",
  ];

  const perSourceQueries = sourceTitles.flatMap((title) => [
    `key ideas and facts from ${title}`,
    `definitions and important details in ${title}`,
  ]);

  return [...baseQueries, ...perSourceQueries];
}

export class FlashcardRAGService {
  async retrieveForFlashcards(input: {
    workspaceId: string;
    sourceIds?: string[];
    numberOfCards: number;
  }): Promise<FlashcardRagContext> {
    const { workspaceId, numberOfCards } = input;

    const { sources } = await sourceRepository.findAllByWorkspace(workspaceId, {
      page: 1,
      limit: 1000,
    });

    let scopedSources: ScopedSource[] = sources.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
    }));

    if (input.sourceIds && input.sourceIds.length > 0) {
      const requested = new Set(input.sourceIds);
      const missing = input.sourceIds.filter(
        (id) => !scopedSources.some((s) => s.id === id)
      );
      if (missing.length > 0) {
        throw new Error(
          `Requested source(s) not found in this workspace: ${missing.join(", ")}`
        );
      }
      scopedSources = scopedSources.filter((s) => requested.has(s.id));
    }

    if (scopedSources.length === 0) {
      throw new Error("No sources found in this workspace");
    }

    const sourceTitles = new Map<string, string>();
    for (const s of scopedSources) {
      sourceTitles.set(s.id, s.title);
    }

    // ---- Stage 1: load chunk structure from Postgres (full text) ----
    const structured: StructuredSource[] = [];
    const chunkByKey = new Map<string, FlashcardContextChunk>();
    let totalChunks = 0;

    for (const source of scopedSources) {
      const rows = await chunkRepository.findBySourceId(source.id);
      const scopedChunks: ScopedChunk[] = rows.map((r) => ({
        id: chunkKey(source.id, r.index),
        sourceId: source.id,
        index: r.index,
        text: r.text,
      }));

      if (scopedChunks.length === 0) continue;

      const structuredSource = structureSource(source, scopedChunks);
      structured.push(structuredSource);
      totalChunks += scopedChunks.length;

      for (const chunk of scopedChunks) {
        chunkByKey.set(chunk.id, {
          id: chunk.id,
          text: chunk.text,
          sourceId: source.id,
          sourceTitle: source.title,
          chunkIndex: chunk.index,
          sectionTitle: structuredSource.chunkToSection.get(chunk.index) ?? source.title,
        });
      }
    }

    if (structured.length === 0 || totalChunks === 0) {
      throw new Error("No chunked content found in this workspace");
    }

    const { target, charCap } = budgetForCards(numberOfCards);
    console.info(
      `[flashcard-rag] workspace=${workspaceId} sources=${structured.length} totalChunks=${totalChunks} requestedCards=${numberOfCards} target=${target}`
    );

    // ---- Stage 2: representative coverage pass (deterministic) ----
    const representative = selectRepresentativeChunks(
      structured,
      chunkByKey,
      target,
      totalChunks
    );
    const selected = representative.selected;
    const sectionAnchors = representative.sectionAnchors;

    console.info(`[flashcard-rag] stage=representative candidates=${selected.size}`);

    // ---- Stage 3: important-concept pass (vector similarity, no per-query LLM rerank) ----
    const queries = buildFlashcardQueries(scopedSources.map((s) => s.title));
    const important = new Map<string, FlashcardContextChunk>();

    for (const query of queries) {
      const retrieved = await hybridRetrieval([query], [], workspaceId);
      for (const c of retrieved) {
        const key = chunkKey(c.sourceId, c.chunkIndex);
        const full = chunkByKey.get(key);
        if (!full) continue;
        const score = c.score ?? 0;
        const merged: FlashcardContextChunk = {
          ...full,
          score: Math.max(important.get(key)?.score ?? 0, score),
        };
        important.set(key, merged);
      }
    }

    console.info(`[flashcard-rag] stage=important candidates=${important.size}`);

    for (const chunk of important.values()) {
      const existing = selected.get(chunk.id);
      if (!existing || (chunk.score ?? 0) > (existing.score ?? 0)) {
        selected.set(chunk.id, chunk);
      }
    }

    // ---- Stage 4: neighbor expansion around important/anchored chunks ----
    const expansionBudget = Math.max(1, Math.floor(target * 0.25));
    let expanded = 0;
    const candidatesForExpansion = [...selected.values()].sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );

    for (const chunk of candidatesForExpansion) {
      if (expanded >= expansionBudget) break;
      const isAnchor = sectionAnchors.has(chunk.id) || (chunk.score ?? 0) >= 0.55;
      if (!isAnchor) continue;

      const neighbors = await chunkRepository.findNeighbors(
        chunk.sourceId,
        chunk.chunkIndex,
        1
      );

      for (const neighbor of neighbors) {
        if (expanded >= expansionBudget) break;
        const key = chunkKey(neighbor.sourceId, neighbor.index);
        if (selected.has(key)) continue;
        const full = chunkByKey.get(key);
        if (!full) continue;
        selected.set(key, { ...full, score: (chunk.score ?? 0) * 0.9 });
        expanded += 1;
      }
    }

    console.info(`[flashcard-rag] stage=neighbor-expansion added=${expanded}`);

    // ---- Stage 5: dedupe ----
    let merged = [...selected.values()];
    merged = deduplicate(merged);
    console.info(`[flashcard-rag] stage=dedupe candidates=${merged.length}`);

    // ---- Stage 6: deterministic rerank + budget trim ----
    const chunkIndexBySource = new Map<string, Map<number, number>>();
    for (const st of structured) {
      const map = new Map<number, number>();
      st.chunks.forEach((c, i) => map.set(c.index, i));
      chunkIndexBySource.set(st.source.id, map);
    }

    const scored = merged.map((c) => {
      const pos = chunkIndexBySource.get(c.sourceId)?.get(c.chunkIndex) ?? 0;
      const sourceLen =
        structured.find((s) => s.source.id === c.sourceId)?.chunks.length ?? 1;
      const importance = computeImportance({
        chunk: c,
        position: pos,
        sourceLength: sourceLen,
        isAnchor: sectionAnchors.has(c.id),
      });
      return { ...c, score: importance };
    });

    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    const keep = new Set<string>();
    const sectionCoverage = new Map<string, string>();
    for (const c of scored) {
      if (keep.size >= target) break;
      const secKey = `${c.sourceId}::${c.sectionTitle}`;
      if (!sectionCoverage.has(secKey)) {
        sectionCoverage.set(secKey, c.id);
      }
      keep.add(c.id);
    }

    // ---- Stage 7: coverage refinement (single pass, capped) ----
    const coveredSections = new Set(
      [...keep]
        .map((id) => {
          const c = selected.get(id);
          return c ? `${c.sourceId}::${c.sectionTitle}` : "";
        })
        .filter(Boolean)
    );
    let addedRefinement = 0;
    for (const st of structured) {
      for (const section of st.sections) {
        if (keep.size >= target + 8) break;
        const secKey = `${st.source.id}::${section.title}`;
        if (coveredSections.has(secKey)) continue;
        const firstKey = section.chunkIds.find((key) => !keep.has(key));
        if (!firstKey) continue;
        const first = chunkByKey.get(firstKey);
        if (first) {
          keep.add(first.id);
          coveredSections.add(secKey);
          addedRefinement += 1;
        }
      }
    }

    console.info(
      `[flashcard-rag] stage=rerank kept=${keep.size} refinement=${addedRefinement}`
    );

    // ---- Stage 8: coverage-aware assembly in document order ----
    const sectionOrder = new Map<string, number>();
    let orderCounter = 0;
    for (const st of structured) {
      for (const section of st.sections) {
        sectionOrder.set(`${st.source.id}::${section.title}`, orderCounter++);
      }
    }

    const sourceOrder = new Map<string, number>();
    scopedSources.forEach((s, i) => sourceOrder.set(s.id, i));

    const finalChunks: FlashcardContextChunk[] = [];
    const finalSectionIds = new Set<string>();
    for (const id of keep) {
      const c = selected.get(id);
      if (!c) continue;
      finalSectionIds.add(`${c.sourceId}::${c.sectionTitle}`);
      finalChunks.push(c);
    }

    const ordered = sortChunksInDocumentOrder(
      finalChunks,
      sourceOrder,
      sectionOrder
    );

    const assembled: FlashcardContextChunk[] = [];
    let chars = 0;
    for (const c of ordered) {
      if (assembled.length > 0 && chars + c.text.length > charCap) break;
      assembled.push(c);
      chars += c.text.length;
    }

    const sections: FlashcardSection[] = [];
    for (const st of structured) {
      for (const section of st.sections) {
        const secKey = `${st.source.id}::${section.title}`;
        if (!finalSectionIds.has(secKey)) continue;
        const ids = assembled
          .filter(
            (c) => c.sourceId === st.source.id && c.sectionTitle === section.title
          )
          .map((c) => c.id);
        sections.push({
          sourceId: st.source.id,
          sourceTitle: st.source.title,
          title: section.title,
          chunkIds: ids,
        });
      }
    }

    console.info(
      `[flashcard-rag] final chunks=${assembled.length} chars=${chars} sections=${sections.length} sources=${structured.length}`
    );

    return {
      chunks: assembled,
      sections,
      sourceTitles,
    };
  }
}

export const flashcardRAGService = new FlashcardRAGService();

export async function buildFlashcardsRagContext(
  workspaceId: string,
  cardCount: number,
  sourceIds?: string[]
): Promise<FlashcardRagContext> {
  return flashcardRAGService.retrieveForFlashcards({
    workspaceId,
    sourceIds,
    numberOfCards: cardCount,
  });
}