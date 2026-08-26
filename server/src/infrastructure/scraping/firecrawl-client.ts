import FirecrawlApp from "firecrawl";
import { getEnv } from "../../config/env";

function getClient() {
  const env = getEnv();
  if (!env.FIRECRAWL_API_KEY) {
    throw new Error("Firecrawl is not configured");
  }
  return new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });
}

export interface ScrapedContent {
  title: string;
  content: string;
  markdown: string;
  metadata: {
    favicon?: string;
    description?: string;
    language?: string;
  };
}

export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  const app = getClient();
  const result = await app.scrapeUrl(url, {
    formats: ["markdown", "html"],
  });

  return {
    title: result.metadata?.title ?? url,
    content: result.html ?? result.markdown ?? "",
    markdown: result.markdown ?? "",
    metadata: {
      favicon: result.metadata?.favicon,
      description: result.metadata?.description,
      language: result.metadata?.language,
    },
  };
}