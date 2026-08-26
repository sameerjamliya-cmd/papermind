import { describe, it, expect, vi } from "vitest";
import { PdfExtractor } from "./pdf-extractor";
import { WebsiteExtractor } from "./website-extractor";
import { YoutubeExtractor } from "./youtube-extractor";
import { AudioExtractor } from "./audio-extractor";
import { ImageExtractor } from "./image-extractor";
import { MarkdownExtractor } from "./markdown-extractor";
import type { ExtractorInput } from "./extractor";
import type { WebScraper } from "./web-scraper";

function makeInput(overrides?: Partial<ExtractorInput>): ExtractorInput {
  return {
    title: "Test Resource",
    originalUrl: "https://cloudinary.test/file.pdf",
    metadata: {},
    ...overrides,
  };
}

describe("Extractors", () => {
  it("PdfExtractor returns placeholder text", async () => {
    const extractor = new PdfExtractor();
    const result = await extractor.extract(makeInput());
    expect(result).toBe("[placeholder PDF extraction for Test Resource]");
  });

  it("WebsiteExtractor scrapes via Firecrawl when sourceUrl is provided", async () => {
    const webScraper: WebScraper = {
      scrape: vi.fn().mockResolvedValue("# Scraped Website\n\nHello world"),
    };
    const extractor = new WebsiteExtractor(webScraper);

    const result = await extractor.extract(
      makeInput({ metadata: { sourceUrl: "https://example.com" } })
    );

    expect(result).toBe("# Scraped Website\n\nHello world");
    expect(webScraper.scrape).toHaveBeenCalledWith("https://example.com");
  });

  it("WebsiteExtractor returns placeholder when sourceUrl is missing", async () => {
    const webScraper: WebScraper = {
      scrape: vi.fn(),
    };
    const extractor = new WebsiteExtractor(webScraper);

    const result = await extractor.extract(makeInput());

    expect(result).toBe("[placeholder website extraction for Test Resource]");
    expect(webScraper.scrape).not.toHaveBeenCalled();
  });

  it("YoutubeExtractor returns placeholder text", async () => {
    const extractor = new YoutubeExtractor();
    const result = await extractor.extract(makeInput());
    expect(result).toBe("[placeholder YouTube extraction for Test Resource]");
  });

  it("AudioExtractor returns placeholder text", async () => {
    const extractor = new AudioExtractor();
    const result = await extractor.extract(makeInput());
    expect(result).toBe("[placeholder audio extraction for Test Resource]");
  });

  it("ImageExtractor returns placeholder text", async () => {
    const extractor = new ImageExtractor();
    const result = await extractor.extract(makeInput());
    expect(result).toBe("[placeholder image extraction for Test Resource]");
  });

  it("MarkdownExtractor returns placeholder text", async () => {
    const extractor = new MarkdownExtractor();
    const result = await extractor.extract(makeInput());
    expect(result).toBe("[placeholder markdown extraction for Test Resource]");
  });
});