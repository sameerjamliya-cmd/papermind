export interface FlashcardSourceRef {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  snippet: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  sourceRefs: FlashcardSourceRef[];
}

export interface FlashcardConfig {
  cardCount: number;
}

export interface FlashcardSet {
  id: string;
  workspaceId: string;
  userId: string;
  status: "generating" | "processing" | "ready" | "failed";
  config: FlashcardConfig;
  cards: Flashcard[] | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}