import type { AudioGenerationSettings } from "../types";

export const AUDIO_MODE_CONFIG: AudioGenerationSettings = {
  targetWords: 1050,
  minWords: 900,
  maxWords: 1200,
  maxChunks: 10,
  contextChars: 8000,
  minSegments: 8,
  maxSegments: 14,
  minWordsPerSegment: 60,
  maxWordsPerSegment: 90,
  ttsChunkSize: { minWords: 150, maxWords: 300 },
  ttsConcurrency: 3,
  silenceMs: 500,
};

export const WORDS_PER_MINUTE = 150;

export function estimateDurationSeconds(wordCount: number): number {
  return Math.max(60, Math.ceil(wordCount / WORDS_PER_MINUTE) * 60);
}

export function getAudioModeConfig(): AudioGenerationSettings {
  return AUDIO_MODE_CONFIG;
}
