export interface AudioGenerationSettings {
  targetWords: number;
  minWords: number;
  maxWords: number;
  maxChunks: number;
  contextChars: number;
  minSegments: number;
  maxSegments: number;
  minWordsPerSegment: number;
  maxWordsPerSegment: number;
  ttsChunkSize: { minWords: number; maxWords: number };
  ttsConcurrency: number;
  silenceMs: number;
}
