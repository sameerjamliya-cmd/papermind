interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

interface ChunkResult {
  index: number;
  text: string;
}

export type { ChunkResult };

function splitByParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitByNewlines(text: string): string[] {
  return text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function splitBySentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+[\])'"`'']*|.+$/g);
  return (sentences || [text])
    .map((s) => s.trim())
    .filter(Boolean);
}

function chunkBySize(text: string, chunkSize: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
}

function mergeChunks(chunks: string[], chunkSize: number, overlap: number): string[] {
  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= chunkSize) {
      result.push(chunk);
      continue;
    }
    for (let i = 0; i < chunk.length; i += chunkSize - overlap) {
      const slice = chunk.slice(i, i + chunkSize);
      if (slice.length > 100) result.push(slice);
    }
  }
  return result;
}

export function recursiveChunk(
  text: string,
  options: ChunkOptions = {}
): ChunkResult[] {
  const { chunkSize = 2048, chunkOverlap = 200 } = options;

  let chunks: string[];

  chunks = splitByParagraphs(text);
  if (chunks.length > 1) {
    chunks = mergeChunks(chunks, chunkSize, chunkOverlap);
  } else {
    chunks = splitByNewlines(text);
    if (chunks.length > 1) {
      chunks = mergeChunks(chunks, chunkSize, chunkOverlap);
    } else {
      chunks = splitBySentences(text);
      if (chunks.length > 1) {
        chunks = mergeChunks(chunks, chunkSize, chunkOverlap);
      } else {
        chunks = chunkBySize(text, Math.floor(chunkSize / 4));
      }
    }
  }

  return chunks.map((chunk, i) => ({
    index: i,
    text: chunk.trim(),
  }));
}