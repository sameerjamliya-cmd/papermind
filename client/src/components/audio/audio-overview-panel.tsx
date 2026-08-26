"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  useAudioOverviews,
  useGenerateAudioOverview,
  usePollAudioOverview,
  useDeleteAudioOverview,
} from "@/hooks/use-audio-overview";
import { AudioPlayer } from "./audio-player";
import { TranscriptPanel } from "./transcript-panel";
import { AskPaperMind } from "./ask-papermind";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Headphones,
  Loader2,
  Trash2,
  AlertCircle,
  MessageCircle,
  X,
} from "lucide-react";
import { useSourceStore } from "@/stores/source-store";

const STEPS = [
  "Understanding paper...",
  "Generating discussion...",
  "Creating voices...",
  "Finalizing audio...",
];

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function AudioOverviewPanel() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { data: overviewsData } = useAudioOverviews(workspaceId);
  const generateMutation = useGenerateAudioOverview(workspaceId);
  const deleteMutation = useDeleteAudioOverview(workspaceId);
  const setActiveSourceId = useSourceStore((s) => s.setActiveSourceId);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [asking, setAsking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const pollData = usePollAudioOverview(workspaceId, generatingId);
  const overviews = overviewsData?.data ?? [];
  const activePoll = pollData?.data?.data;

  useEffect(() => {
    if (activePoll?.status === "ready") {
      setGeneratingId(null);
      setStepIndex(0);
      setExpandedId(activePoll.id);
    } else if (activePoll?.status === "failed") {
      setGeneratingId(null);
      setStepIndex(0);
    }
  }, [activePoll]);

  useEffect(() => {
    if (generatingId) {
      const interval = setInterval(() => {
        setStepIndex((prev) => (prev + 1) % STEPS.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [generatingId]);

  const handleTimeUpdate = useCallback((t: number) => setCurrentTime(t), []);
  const handleDuration = useCallback((d: number) => setDuration(d), []);

  const handleSourceClick = useCallback(
    (sourceId: string) => {
      setActiveSourceId(sourceId);
    },
    [setActiveSourceId]
  );

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleAsk = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAsking(true);
  }, []);

  const handleResumeAsk = useCallback(() => {
    setAsking(false);
  }, []);

  const handleGenerate = useCallback(() => {
    setExpandedId(null);
    generateMutation.mutate(undefined, {
      onSuccess: (data) => {
        setGeneratingId(data.data.id);
        setStepIndex(0);
      },
    });
  }, [generateMutation]);

  const handleClose = useCallback(() => {
    setExpandedId(null);
  }, []);

  const readyOverviews = overviews.filter((o) => o.status === "ready");
  const hasActiveGeneration = overviews.some(
    (o) => o.status === "generating" || o.status === "processing"
  );

  const expandedOverview = expandedId
    ? overviews.find((o) => o.id === expandedId)
    : null;

  const segments = expandedOverview?.segments || [];
  const activeSegment = segments.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  return (
    <div className="mx-auto max-w-5xl">
      {!generatingId && !hasActiveGeneration && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Audio Overviews
              </h3>
              <p className="text-xs text-muted-foreground">
                Two hosts discuss your sources in a natural conversation.
              </p>
            </div>
            <Button
              size="sm"
              disabled={generateMutation.isPending}
              onClick={handleGenerate}
              className="self-start"
            >
              {generateMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Headphones className="size-3.5" />
              )}
              {generateMutation.isPending ? "Starting..." : "Generate overview"}
            </Button>
          </div>

          {readyOverviews.length > 0 && (
            <Select
              value={expandedId ?? ""}
              onValueChange={(value) => setExpandedId(value || null)}
            >
              <SelectTrigger className="h-8 w-full max-w-xs bg-muted/40 text-xs">
                <SelectValue placeholder="Select an audio overview" />
              </SelectTrigger>
              <SelectContent>
                {readyOverviews.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {generateMutation.isError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          {(generateMutation.error as Error)?.message ||
            "Failed to start generation"}
        </div>
      )}

      {expandedOverview && readyOverviews.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {expandedOverview.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    6–8 min
                  </Badge>
                  {expandedOverview.estimatedDuration && (
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      ~{formatDuration(expandedOverview.estimatedDuration)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleClose}
                  aria-label="Close audio player"
                >
                  <X className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-[10px] text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    deleteMutation.mutate(expandedOverview.id);
                    setExpandedId(null);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-3" />
                  Delete
                </Button>
              </div>
            </div>

            <AudioPlayer
              audioUrl={expandedOverview.audioUrl!}
              title={expandedOverview.title}
              segments={expandedOverview.segments || []}
              currentTime={currentTime}
              duration={duration}
              onTimeUpdate={handleTimeUpdate}
              onDuration={handleDuration}
              audioRef={audioRef}
            />

            {asking ? (
              <AskPaperMind
                workspaceId={workspaceId}
                overviewId={expandedOverview.id}
                segmentId={activeSegment?.id || null}
                segmentText={activeSegment?.text}
                onResume={handleResumeAsk}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={handleAsk}
              >
                <MessageCircle className="size-3.5" />
                Ask PaperMind
              </Button>
            )}

            {!hasActiveGeneration && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Headphones className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Generate new overview
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Two hosts discuss your documents in a natural 6–8 minute
                      conversation.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={handleGenerate}
                >
                  Generate
                </Button>
              </div>
            )}

            {hasActiveGeneration && (
              <div className="flex items-center gap-2 text-[10px] text-amber-500">
                <Loader2 className="size-3 animate-spin" />
                Generating new audio...
              </div>
            )}
          </div>

          <div className="h-[400px] overflow-hidden rounded-xl border border-border bg-card">
            <TranscriptPanel
              segments={expandedOverview.segments || []}
              currentTime={currentTime}
              onSeek={seekTo}
              onSourceClick={handleSourceClick}
            />
          </div>
        </div>
      )}

      {!expandedOverview && !generatingId && readyOverviews.length === 0 && !hasActiveGeneration && (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/30 py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Headphones className="size-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">No audio overview yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Generate one to hear your sources discussed.
            </p>
          </div>
          <Button size="sm" onClick={handleGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Headphones className="size-3.5" />
            )}
            Generate overview
          </Button>
        </div>
      )}

      {generatingId && !expandedOverview && (
        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-border bg-card py-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
          <div className="w-full max-w-xs text-center">
            <p className="text-sm font-medium text-foreground">
              Creating Audio Overview
            </p>
            <p
              className="mt-1 text-xs text-muted-foreground animate-pulse transition-all duration-500"
              key={stepIndex}
            >
              {STEPS[stepIndex]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
