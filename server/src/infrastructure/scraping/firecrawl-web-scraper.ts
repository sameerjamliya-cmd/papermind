import type { WebScraper } from "../../ai/ingestion/extractors/web-scraper";
import { scrapeWebsite } from "./firecrawl-client";

export class FirecrawlWebScraper implements WebScraper {
  async scrape(url: string): Promise<string> {
    const scraped = await scrapeWebsite(url);
    return (scraped.markdown ?? scraped.content ?? "").trim();
  }
}