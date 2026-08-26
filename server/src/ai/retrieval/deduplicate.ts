interface HasText {
  text: string;
}

export function deduplicate<T extends HasText>(chunks: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const c of chunks) {
    const key = c.text.slice(0, 100);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(c);
  }
  return unique;
}