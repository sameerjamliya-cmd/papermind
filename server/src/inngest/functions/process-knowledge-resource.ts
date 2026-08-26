import { inngest } from "../client";
import { KnowledgeResourceStatus } from "../../domain/enums/knowledge-resource-status";
import { IngestionPipeline } from "../../ai/ingestion/pipeline/ingestion-pipeline";
import type { IngestionState } from "../../ai/ingestion/types/ingestion-state";
import { PrismaKnowledgeResourceRepository } from "../../infrastructure/persistence/prisma-knowledge-resource-repository";
import { PrismaKnowledgeResourceChunkRepository } from "../../infrastructure/persistence/prisma-knowledge-resource-chunk-repository";
import { FirecrawlWebScraper } from "../../infrastructure/scraping/firecrawl-web-scraper";
import { OpenAIEmbedder } from "../../infrastructure/embedders/openai-embedder";
import { PineconeVectorIndexer } from "../../infrastructure/vector-store/pinecone-vector-indexer";
import { createResourceId } from "../../domain/primitives/brand";

const knowledgeResourceRepository = new PrismaKnowledgeResourceRepository();

export const processKnowledgeResource: ReturnType<
  typeof inngest.createFunction
> = inngest.createFunction(
  {
    id: "process-knowledge-resource",
    name: "Process Knowledge Resource",
    retries: 2,
    triggers: [{ event: "knowledge-resource.created" }],
  },
  async ({ event, step }) => {
    const { resourceId } = event.data as { resourceId: string };
    const id = createResourceId(resourceId);

    const resource = await step.run("fetch-resource", () =>
      knowledgeResourceRepository.findById(id)
    );

    if (!resource) {
      throw new Error(`Knowledge resource ${resourceId} not found`);
    }

    await step.run("mark-queued", () =>
      knowledgeResourceRepository.updateStatus(id, KnowledgeResourceStatus.Queued)
    );

    await step.run("mark-processing", () =>
      knowledgeResourceRepository.updateStatus(
        id,
        KnowledgeResourceStatus.Processing
      )
    );

    const pipeline = new IngestionPipeline({
      webScraper: new FirecrawlWebScraper(),
      embedder: new OpenAIEmbedder(),
      vectorIndexer: new PineconeVectorIndexer(),
      chunkRepository: new PrismaKnowledgeResourceChunkRepository(),
    });

    const initialState: IngestionState = {
      resourceId: resource.id,
      workspaceId: resource.workspaceId,
      userId: resource.userId,
      title: resource.title,
      type: resource.type,
      originalUrl: resource.originalUrl,
      publicId: resource.publicId,
      metadata: resource.metadata,
      status: KnowledgeResourceStatus.Processing,
      content: null,
      normalizedContent: null,
      chunks: [],
      embeddings: null,
      error: null,
    };

    try {
      const result = await step.run("run-ingestion-pipeline", () =>
        pipeline.run(initialState)
      );

      await step.run("mark-ready", () =>
        knowledgeResourceRepository.update(id, {
          status: KnowledgeResourceStatus.Ready,
          chunkCount: result.state.chunks.length,
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await step.run("mark-failed", () =>
        knowledgeResourceRepository.updateStatus(
          id,
          KnowledgeResourceStatus.Failed,
          message
        )
      );
    }
  }
);