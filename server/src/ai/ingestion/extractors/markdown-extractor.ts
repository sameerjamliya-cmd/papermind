import type { Extractor, ExtractorInput } from "./extractor";

export class MarkdownExtractor implements Extractor {
  readonly name = "markdown";

  async extract(input: ExtractorInput): Promise<string> {
    return `[placeholder markdown extraction for ${input.title}]`.trim();
  }
}