import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { buildAudioRagContext } from "./audio-rag.service";
import { AUDIO_MODE_CONFIG, estimateDurationSeconds } from "../../config/audio-modes";

export { estimateDurationSeconds as estimateDuration };

const sourceRefSchema = z.object({
  chunkId: z.string().min(1),
  snippet: z.string().min(1).max(200),
});

const segmentSchema = z.object({
  speaker: z.enum(["host_a", "host_b"]),
  text: z.string().min(1),
  topic: z.string().min(1),
  sources: z.array(sourceRefSchema).max(3),
});

const podcastScriptSchema = z.object({
  title: z.string().min(1),
  segments: z.array(segmentSchema).min(1),
});

export interface SourceRef {
  chunkId: string;
  snippet: string;
  sourceId: string;
  sourceTitle: string;
}

export interface PodcastSegment {
  speaker: "host_a" | "host_b";
  text: string;
  topic: string;
  sources: SourceRef[];
}

export interface PodcastScript {
  title: string;
  segments: PodcastSegment[];
  estimatedDuration: number;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildAudioSystemInstructions(): string {
  return `You are writing a SPOKEN audio script, not a document. Follow these audio-writing rules at all times:

- Write natural, conversational dialogue between the two hosts.
- Each segment must be a SUBSTANTIAL block of spoken dialogue — a full explanation, a short monologue, or a multi-sentence exchange — not a one-line question or answer.
- NEVER use markdown, bullet lists, numbered lists, tables, headings, code blocks, or parenthetical citations like "(Smith et al., 2020)".
- Avoid symbols, equations, or URLs that cannot be read aloud naturally. Spell out acronyms and abbreviations on first use.
- Do not include stage directions, sound effects, or speaker names inside the spoken text.
- Use contractions, transitions, and casual phrasing so it sounds like a real conversation, not a reading.
- Keep the listener in mind: explain why something matters, not just what it is.
- Vary sentence length. Let Host A ask clarifying questions and Host B answer, react, and elaborate at length.`;
}

function buildSystemPrompt(chunkIndexText: string): string {
  const config = AUDIO_MODE_CONFIG;

  return `${buildAudioSystemInstructions()}

TARGET LENGTH: 6-8 minutes
Target total word count: ${config.targetWords} words (stay within ${config.maxWords} words maximum).
Target number of segments: ${config.minSegments}-${config.maxSegments} segments.
Target length per segment: ${config.minWordsPerSegment}-${config.maxWordsPerSegment} words.

Use the word budget to control depth:
- Ruthlessly prioritize the most important information, but include examples and connections where the source supports them.
- Do not pad or repeat content just to hit a word count.
- If the source material is limited, scale down naturally rather than inventing details.
- Segments should be spoken paragraphs, not bullet points. Host B should often speak 3-6 sentences in a row when explaining a concept.

HOST ROLES:
- Host A (host_a): Curious, asks thoughtful questions, introduces topics, occasionally challenges or clarifies ideas.
- Host B (host_b): Knowledgeable, explains concepts clearly, provides technical context and depth.

Each segment must include:
- "topic": Describe the chapter/topic being discussed
- "sources": Array of source references. ONLY reference CHUNK IDs from the provided chunk index below.

CHUNK INDEX (only these IDs are valid):
${chunkIndexText}

Rules:
- Remain faithful to the provided sources — never invent facts
- For each segment, include 0-3 relevant sources from the CHUNK INDEX
- Use the exact chunk "id" from the index as the chunkId
- Include a short "snippet" from the chunk that supports this segment's point
- Sound like a natural conversation — aim for ${config.minSegments}-${config.maxSegments} segments
- Each segment must be roughly ${config.minWordsPerSegment}-${config.maxWordsPerSegment} words

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation.`;
}

export interface GeneratePodcastScriptOptions {
  sourceTitle?: string;
}

export async function generatePodcastScript(
  workspaceId: string,
  options: GeneratePodcastScriptOptions = {}
): Promise<PodcastScript> {
  const { sourceTitle } = options;
  const config = AUDIO_MODE_CONFIG;

  const ragContext = await buildAudioRagContext({
    workspaceId,
    sourceTitle,
  });

  const chunkMap = new Map<string, { id: string; text: string; sourceId: string }>();
  const chunkIndex: Array<{ id: string; snippet: string; sourceTitle: string }> = [];
  for (const c of ragContext.chunks) {
    const snippet = c.text.slice(0, 120).replace(/\n/g, " ");
    chunkMap.set(c.id, { id: c.id, text: c.text, sourceId: c.sourceId });
    chunkIndex.push({
      id: c.id,
      snippet,
      sourceTitle: ragContext.sourceTitles.get(c.sourceId) ?? "Unknown",
    });
  }

  const chunkIndexText = chunkIndex
    .map(
      (c, i) =>
        `[CHUNK_${i}] id="${c.id}" source="${c.sourceTitle}" "${c.snippet}..."`
    )
    .join("\n");

  const contextText = ragContext.chunks
    .map(
      (c) =>
        `[CHUNK id="${c.id}" source="${ragContext.sourceTitles.get(c.sourceId) ?? "Unknown"}"] ${c.text}`
    )
    .join("\n\n---\n\n");

  const validChunkIds = new Set(chunkMap.keys());
  const maxAttempts = 3;
  let lastObject: z.infer<typeof podcastScriptSchema> | null = null;
  let lastSegments: PodcastSegment[] = [];
  let lastTotalWords = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const retryNote =
      attempt > 1
        ? `\n\nIMPORTANT: The previous script was too short (${lastTotalWords} words). Target is at least ${config.minWords} words. Expand significantly with more explanation, examples, and connections. Do not shorten.`
        : "";

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: buildSystemPrompt(chunkIndexText),
      prompt: `Create a podcast conversation about the following research content.

RESEARCH CONTENT:
${contextText.slice(0, config.contextChars)}

${sourceTitle ? `FOCUS DOCUMENT: ${sourceTitle}` : ""}${retryNote}

Return a JSON object with exactly this structure:
{
  "title": "string",
  "segments": [
    {
      "speaker": "host_a",
      "text": "string",
      "topic": "string",
      "sources": [{"chunkId": "string", "snippet": "string"}]
    }
  ]
}`,
      temperature: 0.7,
    });

    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const object = podcastScriptSchema.parse(JSON.parse(cleaned));
    lastObject = object;

    const enrichedSegments: PodcastSegment[] = object.segments.map((seg) => ({
      speaker: seg.speaker,
      text: seg.text,
      topic: seg.topic,
      sources: seg.sources
        .filter((s) => validChunkIds.has(s.chunkId))
        .map((s) => {
          const chunk = chunkMap.get(s.chunkId);
          return {
            chunkId: s.chunkId,
            snippet: s.snippet,
            sourceId: chunk?.sourceId ?? "unknown",
            sourceTitle: chunk
              ? (ragContext.sourceTitles.get(chunk.sourceId) ?? "Unknown")
              : "Unknown",
          };
        }),
    }));

    const totalWords = enrichedSegments.reduce(
      (sum, seg) => sum + countWords(seg.text),
      0
    );

    lastSegments = enrichedSegments;
    lastTotalWords = totalWords;

    if (totalWords >= config.minWords) {
      const estimatedDuration = estimateDurationSeconds(totalWords);
      return { title: object.title, segments: enrichedSegments, estimatedDuration };
    }
  }

  const estimatedDuration = estimateDurationSeconds(lastTotalWords);
  return {
    title: lastObject?.title ?? "Audio Overview",
    segments: lastSegments,
    estimatedDuration,
  };
}
