import type { Extractor, ExtractorInput } from "./extractor";

export class PdfExtractor implements Extractor {
  readonly name = "pdf";

  async extract(input: ExtractorInput): Promise<string> {
    return `[placeholder PDF extraction for ${input.title}]`.trim();
  }
}