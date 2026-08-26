import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { InfographicContextChunk, InfographicRagContext } from "./infographic-rag.service";
import type {
  InfographicContent,
  InfographicSourceRef,
  InfographicStyleId,
  InfographicLanguage,
  VisualType,
} from "../../types";
import type { InfographicStyleMeta } from "./styles";
import type { InfographicLanguageMeta } from "./languages";

const sourceRefSchema = z.object({
  chunkId: z.string().min(1),
  sourceId: z.string().min(1),
  sourceTitle: z.string().min(1),
  snippet: z.string().min(1).max(300),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1).max(8),
  visualType: z.enum([
    "timeline",
    "process_flow",
    "comparison",
    "hierarchy",
    "concept_map",
    "numbered_steps",
    "formula",
    "cycle",
    "architecture_diagram",
  ]),
  sourceRefs: z.array(sourceRefSchema).max(3),
});

const relationshipSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().min(1),
  kind: z.string().min(1),
});

const contentSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string(),
  sections: z.array(sectionSchema).min(1).max(10),
  relationships: z.array(relationshipSchema),
});

function buildContextText(chunks: InfographicContextChunk[]): string {
  const blocks: string[] = [];
  let currentSection: string | null = null;
  let currentSource: string | null = null;

  chunks.forEach((c, i) => {
    if (currentSource !== c.sourceTitle) {
      currentSource = c.sourceTitle;
      blocks.push(`DOCUMENT: ${c.sourceTitle}`);
      currentSection = null;
    }
    if (currentSection !== c.sectionTitle) {
      currentSection = c.sectionTitle;
      blocks.push(`SECTION: ${c.sectionTitle}`);
    }
    blocks.push(`[CHUNK_${i}] id="${c.id}" source="${c.sourceTitle}"\n${c.text}`);
  });

  return blocks.join("\n\n---\n\n");
}

function buildSystemPrompt(params: {
  style: InfographicStyleMeta;
  language: InfographicLanguageMeta;
  prompt?: string;
}): string {
  const { style, language, prompt } = params;

  const languageRules = `
The infographic content must be written in ${language.label} (${language.nativeName}).
- Express all headings, summaries, key points, and relationships in ${language.label}.
- PRESERVE technical terminology, formulas, API names, variable names, register names, programming keywords, and mathematical notation in their original form. Examples: HTTP, TCP/IP, API, React, JavaScript, CPU, RAM, SQL, 8051, TMOD.
- Do not translate source titles, author names, URLs, or technical identifiers.
- Natural code-switching is allowed where it reads better (e.g. technical terms kept in English within a ${language.label} sentence).
- Do NOT translate raw source chunks first; use the source material to understand the facts, then write the infographic directly in ${language.label}.
`;

  const styleRules = `
Visual style: ${style.name} — ${style.description}
${style.visualDescription}
CRITICAL: The visual style affects PRESENTATION ONLY (layout, colors, typography, density, diagram appearance). It must NEVER change, omit, or add facts. The same source material must yield the same factual content regardless of style. Choose a sensible "visualType" for each section that fits both the content and the style.
`;

  const promptRules = prompt
    ? `
The user wants this infographic to emphasize: "${prompt}"
Use this to decide WHAT to emphasize and HOW to organize the sections. Never fabricate information that is not present in the sources. If the requested focus is not covered by the available material, cover the most relevant available content instead.
`
    : `
No specific focus was given. Generate an infographic covering the most important concepts across the provided source material.
`;

  return `You are an expert infographic planner. You produce structured infographic data — never HTML, CSS, or image instructions.

${styleRules}

${languageRules}

${promptRules}

Source material is the ONLY factual authority. Every factual claim must be supported by the source context.

Rules:
- Choose sections that represent the important concepts in the material.
- For each section pick the most appropriate visualType from: timeline, process_flow, comparison, hierarchy, concept_map, numbered_steps, formula, cycle, architecture_diagram.
- Include 0-3 source references per section using ONLY chunk IDs from the CHUNK INDEX.
- Write title, subtitle, summaries, key points, and relationships in ${language.label} while preserving technical terms.
- Keep text concise so it fits on an infographic.

Return ONLY valid JSON matching the provided schema.`;
}

export async function planInfographic(input: {
  context: InfographicRagContext;
  style: InfographicStyleMeta;
  language: InfographicLanguageMeta;
  prompt?: string;
  styleId: InfographicStyleId;
  languageCode: InfographicLanguage;
}): Promise<InfographicContent> {
  const { context } = input;

  if (context.chunks.length === 0) {
    throw new Error("No source context retrieved to plan the infographic");
  }

  const validChunkIds = new Set(context.chunks.map((c) => c.id));
  const chunkMap = new Map(
    context.chunks.map((c) => [
      c.id,
      { id: c.id, text: c.text, sourceId: c.sourceId, sourceTitle: c.sourceTitle },
    ])
  );

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: contentSchema,
    prompt: `${buildSystemPrompt({
      style: input.style,
      language: input.language,
      prompt: input.prompt,
    })}

CHUNK INDEX (only these IDs are valid):
${context.chunks.map((c, i) => `[CHUNK_${i}] id="${c.id}" source="${c.sourceTitle}"`).join("\n")}

SOURCE MATERIAL:
${buildContextText(context.chunks)}

Plan a ${input.style.name} infographic in ${input.language.label} based on the material above.`,
    temperature: 0.6,
  });

  const enriched: InfographicContent = {
    title: object.title,
    subtitle: object.subtitle,
    sections: object.sections.map((s) => ({
      id: s.id,
      title: s.title,
      summary: s.summary,
      keyPoints: s.keyPoints,
      visualType: s.visualType as VisualType,
      sourceRefs: s.sourceRefs
        .filter((r) => validChunkIds.has(r.chunkId))
        .map((r) => {
          const chunk = chunkMap.get(r.chunkId);
          return {
            chunkId: r.chunkId,
            sourceId: chunk?.sourceId ?? r.sourceId,
            sourceTitle: chunk?.sourceTitle ?? r.sourceTitle,
            snippet: r.snippet,
          } as InfographicSourceRef;
        }),
    })),
    relationships: object.relationships,
  };

  return enriched;
}