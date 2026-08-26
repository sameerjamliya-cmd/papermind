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
  options?: string[]; // for multiple_choice and true_false
  correctAnswer: string;
  explanation: string;
  sourceRefs: QuizSourceRef[];
}

export interface QuizConfig {
  difficulty: QuizDifficulty;
  questionCount: number;
  questionTypes: QuizQuestionType[];
}

export interface Quiz {
  id: string;
  workspaceId: string;
  userId: string;
  status: "generating" | "ready" | "failed";
  config: QuizConfig;
  questions: QuizQuestion[] | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
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
