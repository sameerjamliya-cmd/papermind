import type {
  WebSearcher,
  WebSearchResult,
} from "../../application/ports/web-searcher";
import { getEnv } from "../../config/env";

interface TavilyResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
}

export class TavilyWebSearcher implements WebSearcher {
  async search(
    query: string,
    maxResults = 5
  ): Promise<readonly WebSearchResult[]> {
    const env = getEnv();
    if (!env.TAVILY_API_KEY) {
      throw new Error("Tavily API key is not configured");
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        max_results: maxResults,
        search_depth: "advanced",
        include_raw_content: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.statusText}`);
    }

    const data = (await response.json()) as TavilyResponse;
    return data.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  }
}