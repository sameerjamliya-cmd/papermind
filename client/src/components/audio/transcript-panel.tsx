"use client";

import { useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatTime } from "./audio-player";
import type { AudioSegment, AudioSegmentSourceRef } from "@/lib/types";

interface TranscriptPanelProps {
  segments: AudioSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  onSourceClick?: (sourceId: string) => void;
}

function SourcePreview({ refs }: { refs: AudioSegmentSourceRef[] }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {refs.map((ref, i) => (
        <span
          key={i}
          className="group/source relative inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 cursor-default"
          title={`${ref.sourceTitle}: "${ref.snippet}"`}
        >
          <span className="opacity-60">{ref.sourceTitle}</span>
          <span className="absolute bottom-full left-0 mb-1 hidden rounded border border-zinc-200 bg-white px-2 py-1.5 shadow-sm group-hover/source:block dark:border-zinc-700 dark:bg-zinc-900 max-w-[260px] z-10">
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              {ref.sourceTitle}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
              &ldquo;{ref.snippet}&rdquo;
            </p>
          </span>
        </span>
      ))}
    </div>
  );
}

export function TranscriptPanel({
  segments,
  currentTime,
  onSeek,
  onSourceClick,
}: TranscriptPanelProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeIndex = segments.findIndex(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  const chapters = useMemo(() => {
    const seen = new Map<string, { topic: string; firstSegment: AudioSegment }>();
    for (const seg of segments) {
      const t = seg.topic || "Untitled";
      if (!seen.has(t)) {
        seen.set(t, { topic: t, firstSegment: seg });
      }
    }
    return Array.from(seen.values());
  }, [segments]);

  const activeChapter = activeIndex >= 0 ? segments[activeIndex]?.topic : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {chapters.length > 0 && (
        <div className="shrink-0 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Chapters
          </p>
          <div className="flex flex-wrap gap-1">
            {chapters.map((ch) => (
              <button
                key={ch.topic}
                onClick={() => onSeek(ch.firstSegment.startTime)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  activeChapter === ch.topic
                    ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                )}
              >
                {ch.topic}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-2">
          {segments.map((seg, i) => {
            const isActive = activeIndex === i;
            const isHostA = seg.speaker === "host_a";
            const hasSources = seg.sourceRefs && seg.sourceRefs.length > 0;

            return (
              <button
                key={seg.id}
                ref={isActive ? activeRef : undefined}
                onClick={() => onSeek(seg.startTime)}
                className={cn(
                  "flex w-full gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                  isActive && "bg-zinc-100 dark:bg-zinc-800"
                )}
              >
                <div className="shrink-0 pt-0.5">
                  <div
                    className={cn(
                      "size-1.5 rounded-full",
                      isHostA ? "bg-blue-500" : "bg-purple-500"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isHostA
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-purple-600 dark:text-purple-400"
                      )}
                    >
                      {isHostA ? "HOST A" : "HOST B"}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {formatTime(seg.startTime)}
                    </span>
                    {hasSources && onSourceClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const firstSource = seg.sourceRefs![0];
                          onSourceClick(firstSource.sourceId);
                        }}
                        className="rounded bg-violet-50 px-1 py-0.5 text-[9px] text-violet-600 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/60"
                        title="Open in source panel"
                      >
                        Source
                      </button>
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 text-xs leading-relaxed",
                      isActive
                        ? "text-zinc-900 dark:text-zinc-100"
                        : "text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {seg.text}
                  </p>
                  {hasSources && (
                    <SourcePreview refs={seg.sourceRefs!} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
