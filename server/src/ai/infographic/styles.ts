import type { InfographicStyleId } from "../../types";

export const PLANNER_VERSION = 1;
export const RENDERER_VERSION = 1;

export interface InfographicStyleMeta {
  id: InfographicStyleId;
  name: string;
  description: string;
  visualDescription: string;
}

export const INFOGRAPHIC_STYLES: InfographicStyleMeta[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, simple, typography-focused visual.",
    visualDescription:
      "Predominantly typography. Generous whitespace, no heavy borders or decorations, a single neutral accent color, simple straight lines and rectangles. Hierarchy built through font size and weight only.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary cards, clean hierarchy and subtle accent colors.",
    visualDescription:
      "Rounded cards with subtle borders and soft shadows, a contemporary accent palette (e.g. indigo/violet with neutral grays), clear section hierarchy, small pill badges, and minimal decorative geometry.",
  },
  {
    id: "academic",
    name: "Academic",
    description: "Structured educational layout optimized for studying.",
    visualDescription:
      "Formal scholarly layout: serif-style headings, clear numbered sections, definition boxes, formula callouts, footnote-style source labels, muted paper tones, ruled lines and structured tables.",
  },
  {
    id: "hand-drawn",
    name: "Hand-drawn",
    description: "Notebook/sketch style with hand-drawn visual elements.",
    visualDescription:
      "Sketch aesthetic: slightly rotated cards, irregular hand-drawn borders (wobbly rectangles), marker-style underlines, paper background, playful arrows, and a warm ink/pen color palette.",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Diagram-heavy style for programming, engineering and CS.",
    visualDescription:
      "Diagram-centric: flow-chart blocks, arrows, boxes with monospace labels, connectors and nodes, dark-on-light technical palette (blues, grays, amber accents), grid-aligned layout.",
  },
  {
    id: "visual-story",
    name: "Visual Story",
    description: "Illustration-driven and narrative.",
    visualDescription:
      "Narrative layout with large illustrative panels, curved shapes, colorful gradient accents, step-by-step scene flow, rounded friendly cards, and story-like headings.",
  },
];

export const INFOGRAPHIC_STYLE_IDS = INFOGRAPHIC_STYLES.map((s) => s.id);

export function getStyleMeta(id: InfographicStyleId): InfographicStyleMeta {
  const style = INFOGRAPHIC_STYLES.find((s) => s.id === id);
  if (!style) throw new Error(`Unknown infographic style: ${id}`);
  return style;
}