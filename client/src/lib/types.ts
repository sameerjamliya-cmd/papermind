export interface Workspace {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  icon: string | null;
  isFavorite: boolean;
  chatModel: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedWorkspace {
  id: string;
  workspaceId: string;
  sharedWithId: string;
  permission: string;
  createdAt: string;
  workspace: Workspace;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  sources: Array<{
    sourceId: string;
    collectionId: string;
    source: Source & { workspace: { id: string; title: string } };
  }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WorkspaceListResponse {
  data: Workspace[];
  pagination: Pagination;
}

export interface WorkspaceResponse {
  data: Workspace;
}

export interface CreateWorkspaceInput {
  title: string;
  description?: string;
  icon?: string;
  chatModel?: string;
}

export interface UpdateWorkspaceInput {
  title?: string;
  description?: string;
  icon?: string;
  chatModel?: string;
}

export type SourceType = "pdf" | "website" | "youtube" | "text" | "markdown" | "websearch";
export type SourceStatus = "pending" | "processing" | "ready" | "error";

export interface Source {
  id: string;
  workspaceId: string;
  userId: string;
  type: SourceType;
  status: SourceStatus;
  title: string;
  url: string | null;
  content: string | null;
  fileUrl: string | null;
  metadata: Record<string, unknown> | null;
  errorMessage: string | null;
  chunkCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SourceListResponse {
  data: Source[];
  pagination: Pagination;
}

export interface SourceResponse {
  data: Source;
}

export interface BulkDeleteResponse {
  deleted: number;
}

export interface AddWebsiteSourceInput {
  type: "website";
  url: string;
  title?: string;
}

export interface AddYouTubeSourceInput {
  type: "youtube";
  url: string;
  title?: string;
}

export interface AddTextSourceInput {
  type: "text";
  title: string;
  content: string;
}

export interface AddMarkdownSourceInput {
  type: "markdown";
  title: string;
  content: string;
}

export interface AddWebSearchSourceInput {
  type: "websearch";
  query: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
}

export type AddSourceInput =
  | AddWebsiteSourceInput
  | AddYouTubeSourceInput
  | AddTextSourceInput
  | AddMarkdownSourceInput
  | AddWebSearchSourceInput;

export interface UpdateSourceInput {
  title?: string;
  status?: SourceStatus;
  errorMessage?: string;
  chunkCount?: number;
}

export interface BulkDeleteSourcesInput {
  sourceIds: string[];
}

export type AudioOverviewStatus = "generating" | "processing" | "ready" | "failed";

export interface AudioSegmentSourceRef {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  snippet: string;
}

export interface AudioSegment {
  id: string;
  audioOverviewId: string;
  order: number;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  topic: string | null;
  sourceRefs: AudioSegmentSourceRef[] | null;
  createdAt: string;
}

export interface AudioOverview {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  status: AudioOverviewStatus;
  audioUrl: string | null;
  duration: number | null;
  estimatedDuration: number | null;
  errorMessage: string | null;
  segments: AudioSegment[];
  createdAt: string;
  updatedAt: string;
}

export interface AudioOverviewResponse {
  data: AudioOverview;
}

export interface AudioOverviewListResponse {
  data: AudioOverview[];
}

export interface CreateAudioOverviewInput {
  title?: string;
}

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizQuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "short_answer";

export interface QuizSourceRef {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  snippet: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourceRefs: QuizSourceRef[];
}

export interface Quiz {
  id: string;
  workspaceId: string;
  userId: string;
  status: "generating" | "processing" | "ready" | "failed";
  config: {
    difficulty: QuizDifficulty;
    questionCount: number;
    questionTypes: QuizQuestionType[];
  };
  questions: QuizQuestion[] | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizResponse {
  data: Quiz;
}

export interface GenerateQuizInput {
  difficulty: QuizDifficulty;
  questionCount: number;
  questionTypes: QuizQuestionType[];
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
}

export interface GradedQuizQuestion extends QuizQuestion {
  userAnswer: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface QuizResult {
  score: number;
  maxScore: number;
  percentage: number;
  questions: GradedQuizQuestion[];
  expression: string;
}

export interface QuizResultResponse {
  data: QuizResult;
}

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

export type FlashcardSetStatus = "generating" | "processing" | "ready" | "failed";

export interface FlashcardSet {
  id: string;
  workspaceId: string;
  userId: string;
  status: FlashcardSetStatus;
  config: {
    cardCount: number;
  };
  cards: Flashcard[] | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardSetResponse {
  data: FlashcardSet;
}

export interface FlashcardSetListResponse {
  data: FlashcardSet[];
}

export interface GenerateFlashcardsInput {
  cardCount: number;
}

export type InfographicStyleId =
  | "minimal"
  | "modern"
  | "academic"
  | "hand-drawn"
  | "technical"
  | "visual-story";

export type InfographicLanguage =
  | "en"
  | "hi"
  | "ta"
  | "te"
  | "kn"
  | "ml"
  | "mr"
  | "gu"
  | "bn"
  | "pa";

export type VisualType =
  | "timeline"
  | "process_flow"
  | "comparison"
  | "hierarchy"
  | "concept_map"
  | "numbered_steps"
  | "formula"
  | "cycle"
  | "architecture_diagram";

export interface InfographicSourceRef {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  snippet: string;
}

export interface InfographicSection {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  visualType: VisualType;
  sourceRefs: InfographicSourceRef[];
}

export interface InfographicRelationship {
  from: string;
  to: string;
  label: string;
  kind: string;
}

export interface InfographicContent {
  title: string;
  subtitle?: string;
  sections: InfographicSection[];
  relationships: InfographicRelationship[];
}

export interface InfographicConfig {
  styleId: InfographicStyleId;
  language: InfographicLanguage;
  prompt: string;
}

export type InfographicStatus = "generating" | "processing" | "ready" | "failed";

export interface Infographic {
  id: string;
  workspaceId: string;
  userId: string;
  status: InfographicStatus;
  config: InfographicConfig;
  content: InfographicContent | null;
  language: string;
  plannerVersion: number;
  rendererVersion: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InfographicResponse {
  data: Infographic;
}

export interface InfographicListResponse {
  data: Infographic[];
}

export interface GenerateInfographicInput {
  styleId: InfographicStyleId;
  language: InfographicLanguage;
  prompt?: string;
  regenerate?: boolean;
}
