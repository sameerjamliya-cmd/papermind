"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useGenerateQuiz,
  usePollQuiz,
  useGradeQuiz,
} from "@/hooks/use-quiz";
import { QuizSetup } from "./quiz-setup";
import { QuizQuestionView } from "./quiz-question";
import { QuizResults } from "./quiz-results";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import type {
  QuizDifficulty,
  QuizQuestionType,
  Quiz,
  QuizResult,
  QuizAnswer,
} from "@/lib/types";

type ViewState = "setup" | "generating" | "quiz" | "grading" | "results";

export function QuizPanel() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const generateMutation = useGenerateQuiz(workspaceId);
  const gradeMutation = useGradeQuiz(workspaceId);

  const [view, setView] = useState<ViewState>("setup");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollData = usePollQuiz(workspaceId, quizId);
  const pollQuiz = pollData.data?.data;

  useEffect(() => {
    if (pollQuiz?.status === "ready" && pollQuiz.questions) {
      setQuiz(pollQuiz);
      setView("quiz");
      setCurrentIndex(0);
      setAnswers({});
      setAnswered({});
      setResult(null);
    } else if (pollQuiz?.status === "failed") {
      setError(pollQuiz.errorMessage || "Failed to generate quiz");
      setView("setup");
      setQuizId(null);
    }
  }, [pollQuiz]);

  const handleGenerate = (config: {
    difficulty: QuizDifficulty;
    questionCount: number;
    questionTypes: QuizQuestionType[];
  }) => {
    setError(null);
    setView("generating");
    generateMutation.mutate(config, {
      onSuccess: (data) => {
        setQuizId(data.data.id);
      },
      onError: (err: Error) => {
        setError(err.message || "Failed to start quiz generation");
        setView("setup");
      },
    });
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setAnswered((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions!.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    if (!quiz || !quiz.questions) return;
    const payload: QuizAnswer[] = quiz.questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));
    setView("grading");
    gradeMutation.mutate({ quizId: quiz.id, answers: payload }, {
      onSuccess: (data) => {
        setResult(data.data);
        setView("results");
      },
      onError: (err: Error) => {
        setError(err.message || "Failed to grade quiz");
        setView("quiz");
      },
    });
  };

  const handleRestart = () => {
    setView("setup");
    setQuizId(null);
    setQuiz(null);
    setCurrentIndex(0);
    setAnswers({});
    setAnswered({});
    setResult(null);
    setError(null);
  };

  if (view === "setup") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <QuizSetup onGenerate={handleGenerate} isLoading={generateMutation.isPending} />
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-3.5" />
            {error}
          </div>
        )}
      </div>
    );
  }

  if (view === "generating") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Generating your quiz
          </p>
          <p className="mt-1 text-xs text-muted-foreground animate-pulse">
            Designing questions from your sources...
          </p>
        </div>
      </div>
    );
  }

  if (view === "grading") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Grading your answers...
        </p>
      </div>
    );
  }

  if (view === "results" && result) {
    return <QuizResults result={result} onRestart={handleRestart} />;
  }

  if (view === "quiz" && quiz && quiz.questions) {
    const questions = quiz.questions;
    const currentQuestion = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;
    const hasAnsweredCurrent = !!answered[currentQuestion.id];

    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {Math.round(((currentIndex + 1) / questions.length) * 100)}%
          </span>
        </div>

        <QuizQuestionView
          question={currentQuestion}
          userAnswer={answers[currentQuestion.id] ?? ""}
          isAnswered={hasAnsweredCurrent}
          onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
        />

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          {isLast ? (
            <Button
              size="sm"
              onClick={handleFinish}
              disabled={!hasAnsweredCurrent}
            >
              Finish & Grade
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!hasAnsweredCurrent}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
