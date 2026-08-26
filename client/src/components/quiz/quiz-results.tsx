"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizResult } from "@/lib/types";

interface QuizResultsProps {
  result: QuizResult;
  onRestart: () => void;
}

export function QuizResults({ result, onRestart }: QuizResultsProps) {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-3xl font-semibold text-foreground">
          {result.score} / {result.maxScore}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {result.percentage}% correct
        </p>
        <p className="mt-3 text-sm font-medium text-foreground">
          {result.expression}
        </p>
        <Button className="mt-4" size="sm" onClick={onRestart}>
          Try Again
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">
          Answer explanations
        </h3>
        {result.questions.map((q, idx) => (
          <div
            key={q.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                {idx + 1}.
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {q.question}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded px-1.5 py-0.5",
                      q.isCorrect
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    )}
                  >
                    {q.isCorrect ? (
                      <CheckCircle2 className="size-3" />
                    ) : (
                      <XCircle className="size-3" />
                    )}
                    {q.score} / {q.maxScore}
                  </span>
                  {q.type === "short_answer" && (
                    <span className="flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-foreground/80">
                      <HelpCircle className="size-3" />
                      LLM graded
                    </span>
                  )}
                </div>

                {!q.isCorrect && (
                  <div className="mt-2 text-xs">
                    <p className="text-foreground/80">
                      <span className="font-medium">Your answer:</span>{" "}
                      {q.userAnswer || "No answer"}
                    </p>
                    <p className="mt-1 text-foreground/80">
                      <span className="font-medium">Correct answer:</span>{" "}
                      {q.correctAnswer}
                    </p>
                  </div>
                )}

                <p className="mt-2 text-xs text-foreground/80">
                  <span className="font-medium">Explanation:</span>{" "}
                  {q.explanation}
                </p>
                {q.feedback && (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    {q.feedback}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={onRestart}>
          Generate New Quiz
        </Button>
      </div>
    </div>
  );
}
