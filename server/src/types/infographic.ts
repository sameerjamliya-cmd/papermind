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

export interface Infographic {
  id: string;
  workspaceId: string;
  userId: string;
  status: "generating" | "processing" | "ready" | "failed";
  config: InfographicConfig;
  content: InfographicContent | null;
  language: string;
  plannerVersion: number;
  rendererVersion: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}