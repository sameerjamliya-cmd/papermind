import type { Extractor, ExtractorInput } from "./extractor";

export class ImageExtractor implements Extractor {
  readonly name = "image";

  async extract(input: ExtractorInput): Promise<string> {
    return `[placeholder image extraction for ${input.title}]`.trim();
  }
}