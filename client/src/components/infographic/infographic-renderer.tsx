"use client";

import type {
  InfographicContent,
  InfographicSection,
  InfographicStyleId,
  VisualType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface Theme {
  page: React.CSSProperties;
  title: React.CSSProperties;
  subtitle: React.CSSProperties;
  card: React.CSSProperties;
  cardHeading: React.CSSProperties;
  body: React.CSSProperties;
  accent: string;
  accentSoft: string;
  badge: React.CSSProperties;
  keyPoint: React.CSSProperties;
  divider: React.CSSProperties;
  mono?: boolean;
}

const THEMES: Record<InfographicStyleId, Theme> = {
  minimal: {
    page: { background: "#ffffff", color: "#111827" },
    title: { color: "#111827" },
    subtitle: { color: "#6b7280" },
    card: {
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "2px",
    },
    cardHeading: { color: "#111827" },
    body: { color: "#374151" },
    accent: "#4b5563",
    accentSoft: "#f3f4f6",
    badge: { background: "#f3f4f6", color: "#374151" },
    keyPoint: { color: "#374151" },
    divider: { borderTop: "1px solid #e5e7eb" },
  },
  modern: {
    page: { background: "#fafafa", color: "#18181b" },
    title: { color: "#18181b" },
    subtitle: { color: "#71717a" },
    card: {
      background: "#ffffff",
      border: "1px solid #e4e4e7",
      borderRadius: "14px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
    },
    cardHeading: { color: "#18181b" },
    body: { color: "#3f3f46" },
    accent: "#4f46e5",
    accentSoft: "#eef2ff",
    badge: { background: "#eef2ff", color: "#4338ca" },
    keyPoint: { color: "#3f3f46" },
    divider: { borderTop: "1px solid #e4e4e7" },
  },
  academic: {
    page: { background: "#faf7f0", color: "#1c1917" },
    title: { color: "#1c1917", fontFamily: "Georgia, 'Times New Roman', serif" },
    subtitle: { color: "#78716c" },
    card: {
      background: "#ffffff",
      border: "1px solid #d6d3d1",
      borderRadius: "4px",
    },
    cardHeading: {
      color: "#1c1917",
      fontFamily: "Georgia, 'Times New Roman', serif",
    },
    body: { color: "#44403c" },
    accent: "#b45309",
    accentSoft: "#fef3c7",
    badge: { background: "#fef3c7", color: "#92400e" },
    keyPoint: { color: "#44403c" },
    divider: { borderTop: "1px solid #d6d3d1" },
  },
  "hand-drawn": {
    page: { background: "#fffdf5", color: "#292524" },
    title: { color: "#292524" },
    subtitle: { color: "#78716c" },
    card: {
      background: "#ffffff",
      border: "1.5px solid #292524",
      borderRadius: "4px 12px 6px 14px",
      boxShadow: "2px 3px 0 rgba(41,37,36,0.12)",
      transform: "rotate(-0.3deg)",
    },
    cardHeading: {
      color: "#292524",
      textDecoration: "underline",
      textDecorationColor: "#f59e0b",
      textDecorationThickness: "3px",
      textUnderlineOffset: "4px",
    },
    body: { color: "#44403c" },
    accent: "#b45309",
    accentSoft: "#fffbeb",
    badge: { background: "#fffbeb", color: "#92400e", borderRadius: "10px" },
    keyPoint: { color: "#44403c" },
    divider: { borderTop: "1.5px dashed #a8a29e" },
  },
  technical: {
    page: { background: "#f8fafc", color: "#0f172a" },
    title: { color: "#0f172a" },
    subtitle: { color: "#64748b" },
    card: {
      background: "#ffffff",
      border: "1px solid #cbd5e1",
      borderRadius: "6px",
    },
    cardHeading: { color: "#0f172a", fontFamily: "ui-monospace, monospace" },
    body: { color: "#334155" },
    accent: "#2563eb",
    accentSoft: "#eff6ff",
    badge: { background: "#eff6ff", color: "#1d4ed8" },
    keyPoint: { color: "#334155" },
    divider: { borderTop: "1px dashed #cbd5e1" },
    mono: true,
  },
  "visual-story": {
    page: { background: "#fdf4ff", color: "#3b0764" },
    title: { color: "#3b0764" },
    subtitle: { color: "#7c3aed" },
    card: {
      background: "#ffffff",
      border: "1px solid #e9d5ff",
      borderRadius: "18px",
      boxShadow: "0 4px 16px rgba(139,92,246,0.10)",
    },
    cardHeading: { color: "#3b0764" },
    body: { color: "#581c87" },
    accent: "#8b5cf6",
    accentSoft: "#f3e8ff",
    badge: { background: "#f3e8ff", color: "#7e22ce" },
    keyPoint: { color: "#581c87" },
    divider: { borderTop: "1px solid #e9d5ff" },
  },
};

const VISUAL_LABELS: Record<VisualType, string> = {
  timeline: "Timeline",
  process_flow: "Process",
  comparison: "Comparison",
  hierarchy: "Hierarchy",
  concept_map: "Concept map",
  numbered_steps: "Steps",
  formula: "Formula",
  cycle: "Cycle",
  architecture_diagram: "Architecture",
};

function VisualBlock({
  type,
  keyPoints,
  theme,
  mono,
}: {
  type: VisualType;
  keyPoints: string[];
  theme: Theme;
  mono?: boolean;
}) {
  const dot = {
    background: theme.accent,
  } as React.CSSProperties;

  switch (type) {
    case "timeline":
      return (
        <div className="flex flex-col">
          {keyPoints.map((point, i) => (
            <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <span
                  className="mt-1.5 size-2.5 shrink-0 rounded-full"
                  style={dot}
                />
                {i < keyPoints.length - 1 && (
                  <span className="w-px flex-1" style={{ background: theme.accent + "55" }} />
                )}
              </div>
              <p className="text-xs leading-relaxed" style={theme.keyPoint}>
                {point}
              </p>
            </div>
          ))}
        </div>
      );
    case "process_flow":
      return (
        <div className="flex flex-wrap items-center gap-2">
          {keyPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="max-w-[180px] rounded-md px-2.5 py-1.5 text-xs"
                style={{ background: theme.accentSoft, color: theme.keyPoint.color }}
              >
                {point}
              </span>
              {i < keyPoints.length - 1 && (
                <span className="text-sm" style={{ color: theme.accent }}>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      );
    case "comparison": {
      const mid = Math.ceil(keyPoints.length / 2);
      const left = keyPoints.slice(0, mid);
      const right = keyPoints.slice(mid);
      return (
        <div className="flex items-stretch gap-3">
          {[
            { label: "1", items: left },
            { label: "2", items: right },
          ].map((col) => (
            <div
              key={col.label}
              className="flex-1 rounded-md p-2.5"
              style={{ background: theme.accentSoft }}
            >
              <p
                className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: theme.accent }}
              >
                {col.label}
              </p>
              <ul className="space-y-1">
                {col.items.map((item, i) => (
                  <li key={i} className="flex gap-1.5 text-xs" style={theme.keyPoint}>
                    <span className="mt-1 size-1 shrink-0 rounded-full" style={dot} />
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }
    case "hierarchy":
      return (
        <div className="flex flex-col gap-1.5">
          {keyPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-xs" style={{ color: theme.accent }}>└</span>}
              <span
                className={cn(
                  "rounded px-2 py-1 text-xs",
                  i === 0 ? "font-medium" : ""
                )}
                style={
                  i === 0
                    ? { background: theme.accent, color: "#ffffff" }
                    : { background: theme.accentSoft, color: theme.keyPoint.color, marginLeft: "16px" }
                }
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      );
    case "concept_map":
      return (
        <div className="flex flex-col items-center gap-2">
          <span
            className="max-w-[220px] rounded-full px-3 py-1.5 text-center text-xs font-medium"
            style={{ background: theme.accent, color: "#ffffff" }}
          >
            {keyPoints[0]}
          </span>
          {keyPoints.length > 1 && (
            <div className="h-4 w-px" style={{ background: theme.accent + "66" }} />
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {keyPoints.slice(1).map((point, i) => (
              <span
                key={i}
                className="rounded-full border px-2.5 py-1 text-xs"
                style={{
                  background: theme.accentSoft,
                  borderColor: theme.accent + "44",
                  color: theme.keyPoint.color,
                }}
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      );
    case "numbered_steps":
      return (
        <ol className="flex flex-col gap-2">
          {keyPoints.map((point, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: theme.accent, color: "#ffffff" }}
              >
                {i + 1}
              </span>
              <span className="text-xs" style={theme.keyPoint}>{point}</span>
            </li>
          ))}
        </ol>
      );
    case "formula":
      return (
        <div
          className="rounded-md px-3 py-2.5 text-xs"
          style={{
            background: theme.accentSoft,
            color: theme.keyPoint.color,
            fontFamily: mono ? "ui-monospace, monospace" : undefined,
          }}
        >
          {keyPoints.map((line, i) => (
            <p key={i} className="leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      );
    case "cycle":
      return (
        <div
          className="rounded-full border border-dashed px-4 py-3"
          style={{ borderColor: theme.accent + "66" }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            {keyPoints.map((point, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 text-xs"
                  style={{ background: theme.accentSoft, color: theme.keyPoint.color }}
                >
                  {point}
                </span>
                {i < keyPoints.length - 1 && (
                  <span className="text-xs" style={{ color: theme.accent }}>↻</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    case "architecture_diagram":
      return (
        <div className="flex flex-col gap-1.5">
          {keyPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-16 shrink-0 rounded px-1.5 py-1 text-center text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: theme.accent, color: "#ffffff" }}
              >
                L{i + 1}
              </span>
              <span
                className="flex-1 rounded px-2.5 py-1.5 text-xs"
                style={{ background: theme.accentSoft, color: theme.keyPoint.color }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      );
  }
}

function SectionCard({
  section,
  theme,
  index,
  mono,
}: {
  section: InfographicSection;
  theme: Theme;
  index: number;
  mono?: boolean;
}) {
  const sources = [...new Set(section.sourceRefs.map((r) => r.sourceTitle))];
  return (
    <section style={theme.card} className="overflow-hidden">
      <div
        className="flex items-center justify-between gap-2 border-b px-4 py-2.5"
        style={theme.divider}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
            style={{ background: theme.accent, color: "#ffffff" }}
          >
            {index + 1}
          </span>
          <h3 className="text-sm font-semibold" style={theme.cardHeading}>
            {section.title}
          </h3>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
          style={theme.badge}
        >
          {VISUAL_LABELS[section.visualType]}
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs leading-relaxed" style={theme.body}>
          {section.summary}
        </p>
        <VisualBlock
          type={section.visualType}
          keyPoints={section.keyPoints}
          theme={theme}
          mono={mono}
        />
        {sources.length > 0 && (
          <p
            className="border-t pt-2 text-[9px] italic"
            style={{ ...theme.divider, color: theme.subtitle.color }}
          >
            Sources: {sources.join(" · ")}
          </p>
        )}
      </div>
    </section>
  );
}

export function InfographicRenderer({
  content,
  styleId,
  fontClass,
  className,
}: {
  content: InfographicContent;
  styleId: InfographicStyleId;
  fontClass?: string;
  className?: string;
}) {
  const theme = THEMES[styleId];
  const hasRelationships = content.relationships.length > 0;

  return (
    <div
      className={cn("w-full", fontClass, className)}
      style={{ ...theme.page, fontFamily: theme.mono ? undefined : undefined }}
    >
      <div className="p-5 sm:p-8">
        <header className="mb-6 text-center">
          {theme.mono && (
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest" style={{ color: theme.accent }}>
              {"// papermind"}
            </p>
          )}
          <h1
            className="text-xl font-bold leading-tight sm:text-2xl"
            style={theme.title}
          >
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="mt-1.5 text-xs sm:text-sm" style={theme.subtitle}>
              {content.subtitle}
            </p>
          )}
          <div
            className="mx-auto mt-4 w-16"
            style={{ borderTop: `3px solid ${theme.accent}` }}
          />
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {content.sections.map((section, i) => (
            <SectionCard
              key={section.id}
              section={section}
              theme={theme}
              index={i}
              mono={theme.mono}
            />
          ))}
        </div>

        {hasRelationships && (
          <div
            className="mt-6 rounded-lg p-4"
            style={{ ...theme.card, background: theme.accentSoft }}
          >
            <h3
              className="mb-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: theme.accent }}
            >
              Key relationships
            </h3>
            <div className="flex flex-wrap gap-2">
              {content.relationships.map((rel, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px]"
                  style={{ background: "#ffffff", color: theme.keyPoint.color }}
                >
                  <span className="font-medium" style={{ color: theme.accent }}>
                    {rel.from}
                  </span>
                  <span className="italic text-muted-foreground">({rel.label})</span>
                  →
                  <span className="font-medium" style={{ color: theme.accent }}>
                    {rel.to}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[9px]" style={{ color: theme.subtitle.color }}>
          Generated with PaperMind
        </p>
      </div>
    </div>
  );
}