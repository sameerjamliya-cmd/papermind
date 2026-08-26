import { inngest } from "../client";
import { flashcardsRepository } from "../../repository/flashcards.repository";
import { generateFlashcards } from "../../ai/flashcards/flashcards-generator.service";
import type { FlashcardConfig } from "../../types";

export const generateFlashcardsFn: ReturnType<typeof inngest.createFunction> =
  inngest.createFunction(
    {
      id: "generate-flashcards",
      name: "Generate Flashcards",
      retries: 2,
      triggers: [{ event: "flashcards.requested" }],
    },
    async ({ event, step }) => {
      const { deckId, workspaceId, config } = event.data as {
        deckId: string;
        workspaceId: string;
        userId: string;
        config: FlashcardConfig;
      };

      await step.run("mark-processing", () =>
        flashcardsRepository.updateStatus(deckId, "processing")
      );

      try {
        const cards = await step.run("generate-cards", async () => {
          return generateFlashcards(workspaceId, config.cardCount);
        });

        await step.run("mark-ready", () =>
          flashcardsRepository.updateStatus(deckId, "ready", { cards })
        );

        return { deckId, cardCount: cards.length };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await step.run("mark-failed", () =>
          flashcardsRepository.updateStatus(deckId, "failed", {
            errorMessage: message,
          })
        );
        throw error;
      }
    }
  );