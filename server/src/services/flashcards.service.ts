import { NotFoundError, ForbiddenError } from "../types/app-error";
import { flashcardsRepository } from "../repository/flashcards.repository";
import { workspaceRepository } from "../repository/workspace.repository";
import { inngest } from "../inngest/client";
import type { FlashcardConfig } from "../types";

async function getOwnedWorkspace(workspaceId: string, userId: string) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found");
  if (workspace.userId !== userId) throw new ForbiddenError();
  return workspace;
}

export const flashcardsService = {
  async requestDeck(workspaceId: string, userId: string, config: FlashcardConfig) {
    await getOwnedWorkspace(workspaceId, userId);

    const deck = await flashcardsRepository.create({
      workspaceId,
      userId,
      config,
    });

    await inngest.send({
      name: "flashcards.requested",
      data: {
        deckId: deck.id,
        workspaceId,
        userId,
        config,
      },
    });

    return deck;
  },

  async getDeck(deckId: string, workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    const deck = await flashcardsRepository.findById(deckId);
    if (!deck) throw new NotFoundError("Flashcard set not found");
    if (deck.workspaceId !== workspaceId || deck.userId !== userId) {
      throw new ForbiddenError();
    }
    return deck;
  },

  async listDecks(workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    return flashcardsRepository.findAllByWorkspace(workspaceId);
  },

  async deleteDeck(deckId: string, workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    const deck = await flashcardsRepository.findById(deckId);
    if (!deck) throw new NotFoundError("Flashcard set not found");
    if (deck.workspaceId !== workspaceId || deck.userId !== userId) {
      throw new ForbiddenError();
    }
    await flashcardsRepository.delete(deckId);
  },
};