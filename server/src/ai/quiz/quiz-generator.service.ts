import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { buildQuizRagContext } from "./quiz-rag.service";
import type {
  QuizConfig,
  QuizQuestion,
  QuizSourceRef,
} from "../../types";

const sourceRefSchema = z.object({
  chunkId: z.string().min(1),
  sourceId: z.string().min(1),
  sourceTitle: z.string().min(1),
  snippet: z.string().min(1).max(300),
});

const quizQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["multiple_choice", "true_false", "fill_blank", "short_answer"]),
  question: z.string().min(1),
  options: z.array(z.string().min(1)),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
  sourceRefs: z.array(sourceRefSchema).max(3),
});

const quizSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1),
});

const QUESTION_TYPE_LABELS: Record<QuizConfig["questionTypes"][number], string> = {
  multiple_choice: "multiple choice with exactly 4 options",
  true_false: "true/false",
  fill_blank: "fill in the blank",
  short_answer: "short answer",
};

function buildSystemPrompt(config: QuizConfig): string {
  const typeList = config.questionTypes
    .map((t) => QUESTION_TYPE_LABELS[t])
    .join(", ");

  const difficultyInstructions = {
    easy: "Focus on surface-level facts, definitions, and direct recall. Questions should be straightforward and answerable from explicit statements in the text.",
    medium: "Focus on understanding relationships, examples, and applying concepts. Some questions should require connecting two or more ideas.",
    hard: "Focus on inference, nuance, edge cases, and deeper reasoning. Questions may require synthesizing information across sources or evaluating implications.",
  }[config.difficulty];

  return `You are an expert educator creating a quiz from the provided source material.

Quiz settings:
- Difficulty: ${config.difficulty}
- Number of questions: ${config.questionCount}
- Question types to include: ${typeList}

Difficulty guidelines:
${difficultyInstructions}

Question type guidelines:
- Multiple choice: provide exactly 4 plausible options, with one clearly correct answer.
- True/false: the statement must be unambiguously true or false based on the sources.
- Fill in the blank: the blank should be a key term, name, number, or short phrase.
- Short answer: the correct answer should be a concise paragraph (2-4 sentences) that captures the essential idea.

Rules:
- Questions must be faithful to the provided sources. Do not invent facts.
- Each question should test something important, not trivial details.
- Distribute questions across different sources and topics when possible.
- Include 0-3 source references per question using only chunk IDs from the CHUNK INDEX.
- Explanations should teach the user why the answer is correct.

Return ONLY valid JSON matching the provided schema.`;
}

function buildContextText(chunks: { id: string; text: string; sourceTitle: string }[]): string {
  return chunks
    .map(
      (c, i) =>
        `[CHUNK_${i}] id="${c.id}" source="${c.sourceTitle}"\n${c.text}`
    )
    .join("\n\n---\n\n");
}

export async function generateQuiz(
  workspaceId: string,
  config: QuizConfig
): Promise<QuizQuestion[]> {
  const { chunks } = await buildQuizRagContext(
    workspaceId,
    config.difficulty,
    config.questionCount
  );

  if (chunks.length === 0) {
    throw new Error("Not enough source material to generate a quiz");
  }

  const validChunkIds = new Set(chunks.map((c) => c.id));
  const chunkMap = new Map(
    chunks.map((c) => [
      c.id,
      { id: c.id, text: c.text, sourceId: c.sourceId, sourceTitle: c.sourceTitle },
    ])
  );

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: quizSchema,
    prompt: `${buildSystemPrompt(config)}

CHUNK INDEX (only these IDs are valid):
${chunks.map((c, i) => `[CHUNK_${i}] id="${c.id}" source="${c.sourceTitle}"`).join("\n")}

SOURCE MATERIAL:
${buildContextText(chunks)}

Generate ${config.questionCount} quiz questions as a JSON object with a "questions" array.`,
    temperature: 0.7,
  });

  const enrichedQuestions: QuizQuestion[] = object.questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    sourceRefs: q.sourceRefs
      .filter((s) => validChunkIds.has(s.chunkId))
      .map((s) => {
        const chunk = chunkMap.get(s.chunkId);
        return {
          chunkId: s.chunkId,
          sourceId: chunk?.sourceId ?? s.sourceId,
          sourceTitle: chunk?.sourceTitle ?? s.sourceTitle,
          snippet: s.snippet,
        } as QuizSourceRef;
      }),
  }));

  return enrichedQuestions;
}
