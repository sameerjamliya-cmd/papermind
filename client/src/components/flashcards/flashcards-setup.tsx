"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Layers } from "lucide-react";

const CARD_COUNTS = [5, 10, 15, 20, 30, 40];

interface FlashcardsSetupProps {
  onGenerate: (cardCount: number) => void;
  isLoading: boolean;
}

export function FlashcardsSetup({ onGenerate, isLoading }: FlashcardsSetupProps) {
  const [cardCount, setCardCount] = useState<number>(10);

  return (
    <div className="rounded-xl border border-border bg-card p-5 max-w-md">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Layers className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Generate flashcards
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Turn the sources in this workspace into a study deck.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-foreground">Number of cards</Label>
          <Select
            value={String(cardCount)}
            onValueChange={(value) => setCardCount(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARD_COUNTS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          size="sm"
          disabled={isLoading}
          onClick={() => onGenerate(cardCount)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Flashcards"
          )}
        </Button>
      </div>
    </div>
  );
}