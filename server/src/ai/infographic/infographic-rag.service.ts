import { sourceRepository } from "../../repository/source.repository";
import { chunkRepository } from "../../repository/chunk.repository";
import { hybridRetrieval } from "../retrieval/retrieval.service";
import { deduplicate } from "../retrieval/deduplicate";
import { expandQuery } from "../reasoning/query-expansion.service";
import {
  chunkKey,
  structureSource,
  selectRepresentativeChunks,
  computeImportance,
  sortChunksInDocumentOrder,
  type ScopedSource,
  type ScopedChunk,
  type CoverageChunk,
  type StructuredSource,
} from "../retrieval/coverage-selection";

export interface InfographicContextChunk extends CoverageChunk {
  sourceTitle: string;
}

export interface InfographicRagContext {
  chunks: InfographicContextChunk[];
  sections: { sourceId: string; sourceTitle: string; title: string; chunkIds: string[] }[];
  sourceTitles: Map<string, string>;
}

const TARGET_CHUNKS = 40;
const CHAR_CAP = 60000;

function coverageQueries(sourceTitles: string[]): string[] {
  const base = [
    "key concepts definitions and terminology",
    "important facts names dates and figures",
    "core ideas principles and rules",
    "relationships comparisons and connections between ideas",
    "causes effects and implications",
    "specific examples applications and case studies",
  ];
  const perSource = sourceTitles.flatMap((title) => [
    `key ideas and facts from ${title}`,
    `definitions and important details in ${title}`,
  ]);
  return [...base, ...perSource];
}

export class InfographicRAGService {
  async retrieveForInfographic(input: {
    workspaceId: string;
    sourceIds?: string[];
    prompt?: string;
  }): Promise<InfographicRagContext> {
    const { workspaceId, prompt } = input;

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

    const structured: StructuredSource[] = [];
    const chunkByKey = new Map<string, InfographicContextChunk>();
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
          sectionTitle:
            structuredSource.chunkToSection.get(chunk.index) ?? source.title,
        });
      }
    }

    if (structured.length === 0 || totalChunks === 0) {
      throw new Error("No chunked content found in this workspace");
    }

    console.info(
      `[infographic-rag] workspace=${workspaceId} sources=${structured.length} totalChunks=${totalChunks} prompt=${prompt ? prompt.slice(0, 80) : "(none)"}`
    );

    // Representative coverage pass (deterministic, guarantees section coverage).
    const representative = selectRepresentativeChunks(
      structured,
      chunkByKey,
      TARGET_CHUNKS,
      totalChunks
    );
    const selected = representative.selected;
    const sectionAnchors = representative.sectionAnchors;

    console.info(
      `[infographic-rag] stage=representative candidates=${selected.size}`
    );

    // Prompt-aware retrieval: the prompt directs emphasis; sources stay authoritative.
    const important = new Map<string, InfographicContextChunk>();
    const queries: string[] = [];
    let keywords: string[] = [];

    if (prompt && prompt.trim()) {
      queries.push(prompt.trim());
      try {
        const expansion = await expandQuery(prompt.trim());
        if (expansion.stepBack) queries.push(expansion.stepBack);
        if (expansion.subQuestions) queries.push(...expansion.subQuestions.slice(0, 2));
        keywords = expansion.synonyms ?? [];
      } catch {
        // Expansion is best-effort; fall back to the raw prompt.
      }
    }

    const retrievalQueries = [...queries, ...coverageQueries(scopedSources.map((s) => s.title))];

    for (const query of retrievalQueries) {
      const retrieved = await hybridRetrieval([query], keywords, workspaceId);
      for (const c of retrieved) {
        const key = chunkKey(c.sourceId, c.chunkIndex);
        const full = chunkByKey.get(key);
        if (!full) continue;
        const score = c.score ?? 0;
        const merged: InfographicContextChunk = {
          ...full,
          score: Math.max(important.get(key)?.score ?? 0, score),
        };
        important.set(key, merged);
      }
    }

    console.info(`[infographic-rag] stage=important candidates=${important.size}`);

    for (const chunk of important.values()) {
      const existing = selected.get(chunk.id);
      if (!existing || (chunk.score ?? 0) > (existing.score ?? 0)) {
        selected.set(chunk.id, chunk);
      }
    }

    // Neighbor expansion around important/anchored chunks.
    const expansionBudget = Math.max(1, Math.floor(TARGET_CHUNKS * 0.25));
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

    console.info(`[infographic-rag] stage=neighbor-expansion added=${expanded}`);

    let merged = [...selected.values()];
    merged = deduplicate(merged);
    console.info(`[infographic-rag] stage=dedupe candidates=${merged.length}`);

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
    for (const c of scored) {
      if (keep.size >= TARGET_CHUNKS) break;
      keep.add(c.id);
    }

    const coveredSections = new Set(
      [...keep]
        .map((id) => {
          const c = selected.get(id);
          return c ? `${c.sourceId}::${c.sectionTitle}` : "";
        })
        .filter(Boolean)
    );
    for (const st of structured) {
      for (const section of st.sections) {
        if (keep.size >= TARGET_CHUNKS + 8) break;
        const secKey = `${st.source.id}::${section.title}`;
        if (coveredSections.has(secKey)) continue;
        const firstKey = section.chunkIds.find((key) => !keep.has(key));
        if (!firstKey) continue;
        const first = chunkByKey.get(firstKey);
        if (first) {
          keep.add(first.id);
          coveredSections.add(secKey);
        }
      }
    }

    const sectionOrder = new Map<string, number>();
    let orderCounter = 0;
    for (const st of structured) {
      for (const section of st.sections) {
        sectionOrder.set(`${st.source.id}::${section.title}`, orderCounter++);
      }
    }

    const sourceOrder = new Map<string, number>();
    scopedSources.forEach((s, i) => sourceOrder.set(s.id, i));

    const finalChunks: InfographicContextChunk[] = [];
    for (const id of keep) {
      const c = selected.get(id);
      if (c) finalChunks.push(c);
    }

    const ordered = sortChunksInDocumentOrder(finalChunks, sourceOrder, sectionOrder);

    const assembled: InfographicContextChunk[] = [];
    let chars = 0;
    for (const c of ordered) {
      if (assembled.length > 0 && chars + c.text.length > CHAR_CAP) break;
      assembled.push(c);
      chars += c.text.length;
    }

    const sections: InfographicRagContext["sections"] = [];
    for (const st of structured) {
      for (const section of st.sections) {
        const secKey = `${st.source.id}::${section.title}`;
        if (!coveredSections.has(secKey)) continue;
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
      `[infographic-rag] final chunks=${assembled.length} chars=${chars} sections=${sections.length} sources=${structured.length}`
    );

    return {
      chunks: assembled,
      sections,
      sourceTitles,
    };
  }
}

export const infographicRAGService = new InfographicRAGService();