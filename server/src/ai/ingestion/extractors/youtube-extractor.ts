import type { Extractor, ExtractorInput } from "./extractor";

export class YoutubeExtractor implements Extractor {
  readonly name = "youtube";

  async extract(input: ExtractorInput): Promise<string> {
    return `[placeholder YouTube extraction for ${input.title}]`.trim();
  }
}