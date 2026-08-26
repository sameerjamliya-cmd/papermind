import { Pipeline } from "../../pipeline";
import type { IngestionState } from "../types/ingestion-state";
import { validationStage } from "../stages/validation-stage";
import { ExtractionStage } from "../stages/extraction-stage";
import { normalizationStage } from "../stages/normalization-stage";
import { ChunkingStage } from "../stages/chunking-stage";
import { EmbeddingStage } from "../stages/embedding-stage";
import { IndexingStage } from "../stages/indexing-stage";
import { PersistenceStage } from "../stages/persistence-stage";
import { PdfExtractor } from "../extractors/pdf-extractor";
import { WebsiteExtractor } from "../extractors/website-extractor";
import { YoutubeExtractor } from "../extractors/youtube-extractor";
import { AudioExtractor } from "../extractors/audio-extractor";
import { ImageExtractor } from "../extractors/image-extractor";
import { MarkdownExtractor } from "../extractors/markdown-extractor";
import { ResourceType } from "../../../domain/enums/resource-type";
import type { WebScraper } from "../extractors/web-scraper";
import type { Embedder } from "../../../application/ports/embedder";
import type { VectorIndexer } from "../../../application/ports/vector-indexer";
import type { KnowledgeResourceChunkRepository } from "../../../application/ports/knowledge-resource-chunk-repository";

class PlaceholderWebScraper implements WebScraper {
  async scrape(url: string): Promise<string> {
    return `[placeholder web scrape for ${url}]`.trim();
  }
}

class PlaceholderEmbedder implements Embedder {
  async embed(texts: readonly string[]): Promise<ReadonlyArray<readonly number[]>> {
    return texts.map(() => [0.1, 0.2, 0.3]);
  }
}

class PlaceholderVectorIndexer implements VectorIndexer {
  async index(): Promise<void> {
    // placeholder
  }
}

class PlaceholderChunkRepository implements KnowledgeResourceChunkRepository {
  async createMany() {
    return [];
  }
}

export interface IngestionPipelineDependencies {
  readonly webScraper?: WebScraper;
  readonly embedder?: Embedder;
  readonly vectorIndexer?: VectorIndexer;
  readonly chunkRepository?: KnowledgeResourceChunkRepository;
}

export class IngestionPipeline {
  private readonly pipeline: Pipeline<IngestionState>;

  constructor(deps?: IngestionPipelineDependencies) {
    const webScraper = deps?.webScraper ?? new PlaceholderWebScraper();
    const embedder = deps?.embedder ?? new PlaceholderEmbedder();
    const vectorIndexer = deps?.vectorIndexer ?? new PlaceholderVectorIndexer();
    const chunkRepository = deps?.chunkRepository ?? new PlaceholderChunkRepository();

    this.pipeline = new Pipeline<IngestionState>()
      .use(validationStage)
      .use(
        new ExtractionStage({
          [ResourceType.Pdf]: new PdfExtractor(),
          [ResourceType.Website]: new WebsiteExtractor(webScraper),
          [ResourceType.Youtube]: new YoutubeExtractor(),
          [ResourceType.Audio]: new AudioExtractor(),
          [ResourceType.Image]: new ImageExtractor(),
          [ResourceType.Markdown]: new MarkdownExtractor(),
        })
      )
      .use(normalizationStage)
      .use(new ChunkingStage())
      .use(new EmbeddingStage(embedder))
      .use(new IndexingStage(vectorIndexer))
      .use(new PersistenceStage(chunkRepository));
  }

  async run(initialState: IngestionState) {
    return this.pipeline.run(initialState);
  }
}