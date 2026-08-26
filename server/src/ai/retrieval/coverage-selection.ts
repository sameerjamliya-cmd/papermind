export interface ScopedSource {
  id: string;
  title: string;
  type: string;
}

export interface ScopedChunk {
  id: string;
  sourceId: string;
  index: number;
  text: string;
}

export interface CoverageChunk {
  id: string;
  text: string;
  sourceId: string;
  chunkIndex: number;
  sectionTitle: string;
  score?: number;
}

export interface StructuredSource {
  source: ScopedSource;
  chunks: ScopedChunk[];
  sections: { title: string; chunkIds: string[] }[];
  chunkToSection: Map<number, string>;
  sectionOrder: Map<string, number>;
}

export const HEADING_RE = /^\s{0,3}(#{1,6})\s+(.+)\s*$/;

export function detectHeadings(text: string): string[] {
  const headings: string[] = [];
  for (const line of text.split("\n")) {
    const match = line.match(HEADING_RE);
    if (match) headings.push(match[2].trim());
  }
  return headings;
}

export function chunkKey(sourceId: string, index: number): string {
  return `${sourceId}-${index}`;
}

export function budgetForCards(cardCount: number): {
  target: number;
  charCap: number;
} {
  const target = Math.max(16, Math.min(80, cardCount * 2));
  const charCap = Math.min(target * 2048, 60000);
  return { target, charCap };
}

export function structureSource(
  source: ScopedSource,
  chunks: ScopedChunk[]
): StructuredSource {
  const chunkToSection = new Map<number, string>();
  const sections: { title: string; chunkIds: string[] }[] = [];
  const sectionByTitle = new Map<string, number>();
  const hasHeadings = chunks.some((c) => detectHeadings(c.text).length > 0);
  const fallbackTitle = source.title || "Introduction";

  for (const chunk of chunks) {
    let sectionTitle: string;
    if (!hasHeadings) {
      sectionTitle = fallbackTitle;
    } else {
      const headings = detectHeadings(chunk.text);
      const heading = headings[headings.length - 1] ?? null;
      if (heading) {
        sectionTitle = heading;
      } else {
        sectionTitle = chunkToSection.get(chunk.index - 1) ?? "Introduction";
      }
    }
    chunkToSection.set(chunk.index, sectionTitle);
    if (!sectionByTitle.has(sectionTitle)) {
      sectionByTitle.set(sectionTitle, sections.length);
      sections.push({ title: sectionTitle, chunkIds: [] });
    }
    sections[sectionByTitle.get(sectionTitle)!].chunkIds.push(
      chunkKey(source.id, chunk.index)
    );
  }

  return {
    source,
    chunks,
    sections,
    chunkToSection,
    sectionOrder: sectionByTitle,
  };
}

export interface RepresentativeSelection<T extends CoverageChunk> {
  selected: Map<string, T>;
  sectionAnchors: Set<string>;
}

export function selectRepresentativeChunks<T extends CoverageChunk>(
  structured: StructuredSource[],
  chunkLookup: Map<string, T>,
  target: number,
  totalChunks: number
): RepresentativeSelection<T> {
  const selected = new Map<string, T>();
  const sectionAnchors = new Set<string>();

  for (const st of structured) {
    const perSourceBudget = Math.max(
      1,
      Math.round(target * (st.chunks.length / totalChunks))
    );

    for (const section of st.sections) {
      const firstKey = section.chunkIds[0];
      if (!firstKey) continue;
      const anchor = chunkLookup.get(firstKey);
      if (anchor) {
        selected.set(anchor.id, {
          ...anchor,
          score: Math.max(anchor.score ?? 0, 0.8),
        });
        sectionAnchors.add(anchor.id);
      }
    }

    if (selected.size < target) {
      const stride = Math.max(1, Math.floor(st.chunks.length / perSourceBudget));
      let added = 0;
      for (let i = 0; i < st.chunks.length && added < perSourceBudget; i += stride) {
        const chunk = st.chunks[i];
        const full = chunkLookup.get(chunk.id);
        if (!full || selected.has(full.id)) continue;
        selected.set(full.id, { ...full, score: 0.6 });
        added += 1;
      }
    }
  }

  return { selected, sectionAnchors };
}

export function computeImportance<T extends CoverageChunk>(params: {
  chunk: T;
  position: number;
  sourceLength: number;
  isAnchor: boolean;
}): number {
  const { chunk, position, sourceLength, isAnchor } = params;
  const positionBonus = 0.1 * (1 - position / Math.max(1, sourceLength));
  const anchorBonus = isAnchor ? 0.15 : 0;
  return (chunk.score ?? 0.5) * 0.6 + anchorBonus + positionBonus;
}

export function sortChunksInDocumentOrder<T extends CoverageChunk>(
  chunks: T[],
  sourceOrder: Map<string, number>,
  sectionOrder: Map<string, number>
): T[] {
  return [...chunks].sort((a, b) => {
    const so =
      (sourceOrder.get(a.sourceId) ?? 0) - (sourceOrder.get(b.sourceId) ?? 0);
    if (so !== 0) return so;
    const seco =
      (sectionOrder.get(`${a.sourceId}::${a.sectionTitle}`) ?? 0) -
      (sectionOrder.get(`${b.sourceId}::${b.sectionTitle}`) ?? 0);
    if (seco !== 0) return seco;
    return a.chunkIndex - b.chunkIndex;
  });
}