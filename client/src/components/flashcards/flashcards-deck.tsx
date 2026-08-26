"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Shuffle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/lib/types";

interface FlashcardsDeckProps {
  cards: Flashcard[];
  onBack: () => void;
}

export function FlashcardsDeck({ cards, onBack }: FlashcardsDeckProps) {
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = cards[order[currentIndex]];

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % order.length);
  };

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + order.length) % order.length);
  };

  const handleShuffle = () => {
    setOrder((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setFlipped(false);
  };

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Card {currentIndex + 1} of {order.length}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {Math.round(((currentIndex + 1) / order.length) * 100)}%
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / order.length) * 100}%` }}
        />
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "min-h-[260px] cursor-pointer rounded-xl border border-border bg-card p-6 text-left transition-transform duration-300",
          flipped && "[transform:rotateX(180deg)]"
        )}
        style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
      >
        <div
          className={cn(
            "flex h-full min-h-[220px] flex-col transition-opacity duration-200",
            flipped ? "opacity-0" : "opacity-100"
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Front
          </p>
          <p className="mt-4 text-base font-medium text-foreground">
            {current.front}
          </p>
          {current.hint && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lightbulb className="size-3.5" />
              {current.hint}
            </p>
          )}
          <p className="mt-auto pt-4 text-[11px] text-muted-foreground">
            Click to flip
          </p>
        </div>

        <div
          className={cn(
            "flex h-full min-h-[220px] flex-col [transform:rotateX(180deg)] transition-opacity duration-200",
            flipped ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Back
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            {current.back}
          </p>

          {current.sourceRefs.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {current.sourceRefs.map((ref, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-border bg-muted/40 p-2.5"
                >
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {ref.sourceTitle}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-foreground/80">
                    {ref.snippet}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-auto pt-4 text-[11px] text-muted-foreground">
            Click to flip back
          </p>
        </div>
      </button>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 size-3.5" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShuffle}>
            <Shuffle className="mr-1.5 size-3.5" />
            Shuffle
          </Button>
          <Button variant="outline" size="icon-sm" onClick={goPrev} aria-label="Previous card">
            <ArrowLeft className="size-3.5" />
          </Button>
          <Button size="icon-sm" onClick={goNext} aria-label="Next card">
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}