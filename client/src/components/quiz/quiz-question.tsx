"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/types";

interface QuizQuestionViewProps {
  question: QuizQuestion;
  userAnswer: string;
  isAnswered: boolean;
  onAnswer: (answer: string) => void;
}

function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().trim();
}

function isAnswerCorrect(question: QuizQuestion, answer: string): boolean {
  if (!answer.trim()) return false;
  if (question.type === "short_answer") return false;
  return normalizeAnswer(answer) === normalizeAnswer(question.correctAnswer);
}

export function QuizQuestionView({
  question,
  userAnswer,
  isAnswered,
  onAnswer,
}: QuizQuestionViewProps) {
  const [draft, setDraft] = useState(userAnswer);
  const correct = isAnswerCorrect(question, userAnswer);

  const handleOptionSelect = (value: string) => {
    if (isAnswered) return;
    onAnswer(value);
  };

  const handleTextSubmit = () => {
    if (!draft.trim()) return;
    onAnswer(draft.trim());
  };

  const renderInput = () => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <RadioGroup
            value={isAnswered ? userAnswer : ""}
            onValueChange={handleOptionSelect}
            className="space-y-2"
          >
            {question.options?.map((option, idx) => (
              <label
                key={idx}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-xs transition-colors",
                  isAnswered
                    ? normalizeAnswer(option) ===
                        normalizeAnswer(question.correctAnswer)
                      ? "border-green-500/20 bg-green-500/10"
                      : normalizeAnswer(option) === normalizeAnswer(userAnswer)
                        ? "border-red-500/20 bg-red-500/10"
                        : "border-border"
                    : "border-border hover:bg-muted/60"
                )}
              >
                <RadioGroupItem
                  value={option}
                  disabled={isAnswered}
                  className="sr-only"
                />
                <span className="text-foreground">
                  {option}
                </span>
              </label>
            ))}
          </RadioGroup>
        );

      case "true_false":
        return (
          <RadioGroup
            value={isAnswered ? userAnswer : ""}
            onValueChange={handleOptionSelect}
            className="flex gap-2"
          >
            {["True", "False"].map((option) => (
              <label
                key={option}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-xs transition-colors",
                  isAnswered
                    ? normalizeAnswer(option) ===
                        normalizeAnswer(question.correctAnswer)
                      ? "border-green-500/20 bg-green-500/10"
                      : normalizeAnswer(option) === normalizeAnswer(userAnswer)
                        ? "border-red-500/20 bg-red-500/10"
                        : "border-border"
                    : "border-border hover:bg-muted/60"
                )}
              >
                <RadioGroupItem
                  value={option}
                  disabled={isAnswered}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </RadioGroup>
        );

      case "fill_blank":
        return (
          <div className="space-y-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer"
              className="text-xs"
            />
            {!isAnswered && (
              <Button size="sm" onClick={handleTextSubmit} disabled={!draft.trim()}>
                Submit Answer
              </Button>
            )}
          </div>
        );

      case "short_answer":
        return (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isAnswered}
              placeholder="Write your answer"
              className="min-h-[100px] text-xs"
            />
            {!isAnswered && (
              <Button size="sm" onClick={handleTextSubmit} disabled={!draft.trim()}>
                Submit Answer
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
          {question.type.replace(/_/g, " ")}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium text-foreground">
        {question.question}
      </p>

      <div className="mt-4">{renderInput()}</div>

      {isAnswered && (
        <div
          className={cn(
            "mt-4 flex items-start gap-2 rounded-md p-3 text-xs",
            correct
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
              : question.type === "short_answer"
                ? "bg-muted/60 text-foreground/80"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
          )}
        >
          {correct ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <XCircle className="size-4 shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {correct
                ? "Correct!"
                : question.type === "short_answer"
                  ? "Answer recorded"
                  : "Incorrect"}
            </p>
            <p className="mt-1">
              <span className="font-medium">Correct answer:</span>{" "}
              {question.correctAnswer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
