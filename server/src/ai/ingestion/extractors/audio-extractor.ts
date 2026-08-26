import type { Extractor, ExtractorInput } from "./extractor";

export class AudioExtractor implements Extractor {
  readonly name = "audio";

  async extract(input: ExtractorInput): Promise<string> {
    return `[placeholder audio extraction for ${input.title}]`.trim();
  }
}