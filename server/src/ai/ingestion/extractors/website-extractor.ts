import type { Extractor, ExtractorInput } from "./extractor";
import type { WebScraper } from "./web-scraper";

export class WebsiteExtractor implements Extractor {
  readonly name = "website";

  constructor(private readonly webScraper: WebScraper) {}

  async extract(input: ExtractorInput): Promise<string> {
    const sourceUrl = this.readSourceUrl(input);
    if (!sourceUrl) {
      return `[placeholder website extraction for ${input.title}]`.trim();
    }

    return this.webScraper.scrape(sourceUrl);
  }

  private readSourceUrl(input: ExtractorInput): string | undefined {
    const fromMetadata = input.metadata.sourceUrl;
    if (typeof fromMetadata === "string") return fromMetadata;
    return undefined;
  }
}