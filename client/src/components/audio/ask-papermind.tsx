"use client";

import { useState, useCallback, useRef } from "react";
import { Send, X, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AskPaperMindProps {
  workspaceId: string;
  overviewId: string;
  segmentId: string | null;
  segmentText?: string;
  onResume: () => void;
}

export function AskPaperMind({
  workspaceId,
  overviewId,
  segmentId,
  segmentText,
  onResume,
}: AskPaperMindProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<
    Array<{ sourceId: string; sourceTitle: string; sourceType: string }>
  >([]);
  const [status, setStatus] = useState<
    "idle" | "asking" | "answering" | "speaking"
  >("idle");
  const [error, setError] = useState("");
  const answerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!question.trim() || status === "asking" || status === "answering") return;

    setStatus("asking");
    setError("");
    setAnswer("");
    setSources([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/audio-overview/${overviewId}/ask`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.trim(),
            segmentId,
          }),
          signal: controller.signal,
        }
      );

      if (!res.ok) throw new Error("Failed to get answer");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      setStatus("answering");
      const decoder = new TextDecoder();
      let buffer = "";
      let answerText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const event = JSON.parse(trimmed);
            if (event.type === "token") {
              answerText += event.delta;
              setAnswer(answerText);
            }
            if (event.type === "sources") {
              setSources(event.sources || []);
            }
          } catch {
            answerText += trimmed;
            setAnswer(answerText);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message || "Something went wrong");
      }
    } finally {
      abortRef.current = null;
      setStatus("idle");
    }
  }, [question, status, workspaceId, overviewId, segmentId]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  const handleReadAloud = useCallback(async () => {
    if (!answer || status === "speaking") return;
    setStatus("speaking");
    try {
      const res = await fetch(
        `${API_URL}/api/workspaces/${workspaceId}/audio-overview/${overviewId}/ask`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: `Read this aloud in a clear voice: ${answer.slice(0, 1000)}`,
            segmentId: null,
          }),
        }
      );

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setStatus("idle");
      audio.onerror = () => {
        setStatus("idle");
        setError("Audio playback failed");
      };
      await audio.play();
    } catch {
      setStatus("idle");
      setError("Read aloud failed");
    }
  }, [answer, status, workspaceId, overviewId]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
          Ask PaperMind
        </p>
        <button
          onClick={onResume}
          className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Close and resume audio"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {segmentText && (
        <div className="rounded bg-zinc-50 px-2 py-1.5 text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 line-clamp-2">
          &ldquo;{segmentText}&rdquo;
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask about this section..."
          disabled={status === "asking" || status === "answering"}
          className="flex-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
        />
        {status === "asking" || status === "answering" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-8 shrink-0"
          >
            <X className="size-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!question.trim()}
            className="h-8 shrink-0 gap-1"
          >
            <Send className="size-3" />
          </Button>
        )}
      </div>

      {status === "asking" && (
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <Loader2 className="size-3 animate-spin" />
          Thinking...
        </div>
      )}

      {answer && (
        <div ref={answerRef} className="space-y-2">
          <div className="rounded bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {answer}
          </div>

          {sources.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] font-medium text-zinc-400 mr-1">
                Sources:
              </span>
              {sources.map((s, i) => (
                <span
                  key={i}
                  className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-700 dark:bg-violet-950/30 dark:text-violet-400"
                >
                  [{i + 1}] {s.sourceTitle}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 text-[10px] text-zinc-500 hover:text-violet-600"
              onClick={handleReadAloud}
              disabled={status === "speaking"}
            >
              {status === "speaking" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Volume2 className="size-3" />
              )}
              Read aloud
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-zinc-500"
              onClick={onResume}
            >
              Resume Audio
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded bg-red-50 px-2 py-1 text-[10px] text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
