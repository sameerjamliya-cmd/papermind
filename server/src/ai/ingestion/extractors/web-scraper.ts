export interface WebScraper {
  scrape(url: string): Promise<string>;
}