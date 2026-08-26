import type { InfographicStyleId } from "@/lib/types";

export interface InfographicStyleMeta {
  id: InfographicStyleId;
  name: string;
  description: string;
}

export const INFOGRAPHIC_STYLES: InfographicStyleMeta[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, simple, typography-focused visual.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary cards, clean hierarchy and subtle accent colors.",
  },
  {
    id: "academic",
    name: "Academic",
    description: "Structured educational layout optimized for studying.",
  },
  {
    id: "hand-drawn",
    name: "Hand-drawn",
    description: "Notebook/sketch style with hand-drawn visual elements.",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Diagram-heavy style for programming, engineering and CS.",
  },
  {
    id: "visual-story",
    name: "Visual Story",
    description: "Illustration-driven and narrative.",
  },
];