"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AudioSegment } from "@/lib/types";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  segments?: AudioSegment[];
  currentTime: number;
  duration: number;
  onTimeUpdate: (t: number) => void;
  onDuration: (d: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function AudioPlayer({
  audioUrl,
  title,
  segments,
  currentTime,
  duration,
  onTimeUpdate,
  onDuration,
  audioRef,
}: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const activeSegment = segments?.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );
  const activeChapter = activeSegment?.topic;
  const activeSpeaker = activeSegment?.speaker;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      setLoading(false);
      onDuration(audio.duration);
      setError(false);
    };
    const onTime = () => onTimeUpdate(audio.currentTime);
    const onEnd = () => setPlaying(false);
    const onErr = () => {
      setLoading(false);
      setError(true);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [audioUrl, audioRef, onTimeUpdate, onDuration]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted, audioRef]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [playing, audioRef]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
      onTimeUpdate(time);
    },
    [audioRef, onTimeUpdate]
  );

  const skipBack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  }, [audioRef]);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration || 0,
        audioRef.current.currentTime + 10
      );
    }
  }, [audioRef]);

  const toggleMute = useCallback(() => setMuted(!muted), [muted]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const speakerLabel =
    activeSpeaker === "host_a" ? "Host A" : activeSpeaker === "host_b" ? "Host B" : null;

  if (error) {
    return (
      <div
        className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30"
        role="alert"
      >
        <p className="text-xs text-red-600 dark:text-red-400">
          Failed to load audio
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {title && (
        <p className="mb-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {title}
        </p>
      )}

      <div className="space-y-2">
        <div className="relative h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek"
            className="absolute inset-0 w-full cursor-pointer opacity-0"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={skipBack}
              className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className="size-3.5" />
            </button>

            <button
              onClick={togglePlay}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-zinc-100 transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              aria-label={playing ? "Pause" : "Play"}
            >
              {loading ? (
                <div className="size-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
              ) : playing ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5 ml-0.5" />
              )}
            </button>

            <button
              onClick={skipForward}
              className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="size-3.5" />
            </button>

            <span className="ml-1 text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400 min-w-[76px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {speakerLabel && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  activeSpeaker === "host_a"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                )}
              >
                {speakerLabel}
              </span>
            )}

            {activeChapter && (
              <span className="truncate rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400 max-w-[80px]">
                {activeChapter}
              </span>
            )}

            <div className="flex items-center gap-0.5">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    if (audioRef.current) audioRef.current.playbackRate = s;
                  }}
                  className={cn(
                    "rounded px-1 py-0.5 text-[10px] font-medium transition-colors",
                    speed === s
                      ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={toggleMute}
              className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="size-3.5" />
              ) : (
                <Volume2 className="size-3.5" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setMuted(false);
              }}
              aria-label="Volume"
              className="w-16 accent-zinc-900 dark:accent-zinc-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { formatTime };
