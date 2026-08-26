"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useFlashcardSets,
  useGenerateFlashcards,
  usePollFlashcards,
  useDeleteFlashcards,
} from "@/hooks/use-flashcards";
import { FlashcardsSetup } from "./flashcards-setup";
import { FlashcardsDeck } from "./flashcards-deck";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Layers, Trash2, Play } from "lucide-react";
import type { FlashcardSet } from "@/lib/types";

export function FlashcardsPanel() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { data: listData, isLoading: listsLoading } =
    useFlashcardSets(workspaceId);
  const generateMutation = useGenerateFlashcards(workspaceId);
  const deleteMutation = useDeleteFlashcards(workspaceId);

  const [view, setView] = useState<"setup" | "study">("setup");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeDeck, setActiveDeck] = useState<FlashcardSet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollData = usePollFlashcards(workspaceId, generatingId);
  const pollDeck = pollData.data?.data;

  const readyDeck =
    pollDeck?.status === "ready" && pollDeck.cards ? pollDeck : null;
  const failedMessage =
    pollDeck?.status === "failed"
      ? pollDeck.errorMessage || "Failed to generate flashcards"
      : null;
  const isPolling =
    pollDeck?.status === "generating" || pollDeck?.status === "processing";
  const showGenerating =
    generateMutation.isPending ||
    (!!generatingId && (isPolling || pollDeck === undefined));

  const handleGenerate = (cardCount: number) => {
    setError(null);
    setGeneratingId(null);
    generateMutation.mutate(
      { cardCount },
      {
        onSuccess: (data) => {
          setGeneratingId(data.data.id);
        },
        onError: (err: Error) => {
          setError(err.message || "Failed to start flashcard generation");
        },
      }
    );
  };

  const handleStudy = (deck: FlashcardSet) => {
    setError(null);
    setGeneratingId(null);
    setActiveDeck(deck);
    setView("study");
  };

  const handleDelete = (deck: FlashcardSet) => {
    deleteMutation.mutate(deck.id);
  };

  const handleBack = () => {
    setView("setup");
    setActiveDeck(null);
    setGeneratingId(null);
    setError(null);
  };

  if (showGenerating) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Generating your flashcards
          </p>
          <p className="mt-1 text-xs text-muted-foreground animate-pulse">
            Distilling your sources into cards...
          </p>
        </div>
      </div>
    );
  }

  const deckToStudy = readyDeck ?? (view === "study" ? activeDeck : null);

  if (deckToStudy?.cards) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Layers className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {deckToStudy.cards.length} flashcards
              </p>
              <p className="text-[10px] text-muted-foreground">
                Generated {new Date(deckToStudy.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <FlashcardsDeck cards={deckToStudy.cards} onBack={handleBack} />
      </div>
    );
  }

  const decks = listData?.data ?? [];
  const setupError = error || failedMessage;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      {setupError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          {setupError}
        </div>
      )}

      <FlashcardsSetup
        onGenerate={handleGenerate}
        isLoading={generateMutation.isPending}
      />

      {listsLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : decks.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-foreground">Your decks</p>
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {deck.cards?.length ?? deck.config.cardCount} cards
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {deck.status === "ready"
                    ? `Ready · ${new Date(deck.createdAt).toLocaleDateString()}`
                    : deck.status === "failed"
                      ? "Failed"
                      : "Generating..."}
                </p>
                {deck.status === "failed" && deck.errorMessage && (
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-destructive">
                    {deck.errorMessage}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {deck.status === "ready" && deck.cards ? (
                  <Button size="sm" onClick={() => handleStudy(deck)}>
                    <Play className="mr-1.5 size-3.5" />
                    Study
                  </Button>
                ) : deck.status === "failed" ? (
                  <span className="flex items-center text-destructive">
                    <AlertCircle className="size-4" />
                  </span>
                ) : (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Delete deck"
                  onClick={() => handleDelete(deck)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/30 py-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Layers className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No decks yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Generate your first set of flashcards above.
          </p>
        </div>
      )}
    </div>
  );
}