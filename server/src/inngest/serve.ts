import { serve } from "inngest/express";
import { inngest } from "./client";
import { processKnowledgeResource } from "./functions/process-knowledge-resource";
import { processSource } from "../ai/ingestion/process-source-handler";
import { generateAudioOverview } from "./functions/generate-audio-overview";
import { generateQuizFn } from "./functions/generate-quiz";
import { generateFlashcardsFn } from "./functions/generate-flashcards";
import { generateInfographicFn } from "./functions/generate-infographic";
import { syncConversationMemory } from "./functions/sync-conversation-memory";

export const inngestRouter = serve({
  client: inngest,
  functions: [
    inngest.createFunction(
      {
        id: "process-source",
        name: "Process Source",
        retries: 2,
        triggers: [{ event: "source.created" }],
      },
      async ({ event, step }) => {
        const { sourceId, workspaceId } = event.data as {
          sourceId: string;
          workspaceId: string;
        };

        const { contentLength } = await step.run("fetch-content", () =>
          processSource.fetchContent(sourceId)
        );

        const { chunkCount } = await step.run("chunk-content", () =>
          processSource.chunkContent(sourceId, workspaceId)
        );

        const { stored } = await step.run("embed-chunks", () =>
          processSource.embedChunks(sourceId, workspaceId)
        );

        await step.run("mark-ready", () =>
          processSource.markReady(sourceId, chunkCount)
        );

        return { sourceId, chunkCount };
      }
    ),
    processKnowledgeResource,
    generateAudioOverview,
    generateQuizFn,
    generateFlashcardsFn,
    generateInfographicFn,
    syncConversationMemory,
  ],
});