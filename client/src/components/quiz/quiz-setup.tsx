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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Brain } from "lucide-react";
import type {
  QuizDifficulty,
  QuizQuestionType,
} from "@/lib/types";

const QUESTION_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES: { value: QuizDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const QUESTION_TYPES: { value: QuizQuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the blank" },
  { value: "short_answer", label: "Short answer" },
];

interface QuizSetupProps {
  onGenerate: (config: {
    difficulty: QuizDifficulty;
    questionCount: number;
    questionTypes: QuizQuestionType[];
  }) => void;
  isLoading: boolean;
}

export function QuizSetup({ onGenerate, isLoading }: QuizSetupProps) {
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedTypes, setSelectedTypes] = useState<QuizQuestionType[]>([
    "multiple_choice",
    "true_false",
    "fill_blank",
    "short_answer",
  ]);

  const toggleType = (type: QuizQuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = () => {
    if (selectedTypes.length === 0) return;
    onGenerate({ difficulty, questionCount, questionTypes: selectedTypes });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 max-w-md">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <Brain className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Generate a quiz
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Test your understanding of the sources in this workspace.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-foreground">Difficulty</Label>
          <Select
            value={difficulty}
            onValueChange={(value) => setDifficulty(value as QuizDifficulty)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-foreground">Number of questions</Label>
          <Select
            value={String(questionCount)}
            onValueChange={(value) => setQuestionCount(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_COUNTS.map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-foreground">Question types</Label>
          <div className="flex flex-wrap gap-3">
            {QUESTION_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300"
              >
                <Checkbox
                  checked={selectedTypes.includes(type.value)}
                  onCheckedChange={() => toggleType(type.value)}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        <Button
          className="w-full"
          size="sm"
          disabled={isLoading || selectedTypes.length === 0}
          onClick={handleSubmit}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Quiz"
          )}
        </Button>
      </div>
    </div>
  );
}
