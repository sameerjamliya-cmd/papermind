export interface WebSearchResult {
  readonly title: string;
  readonly url: string;
  readonly content: string;
}

export interface WebSearcher {
  search(query: string, maxResults?: number): Promise<readonly WebSearchResult[]>;
}