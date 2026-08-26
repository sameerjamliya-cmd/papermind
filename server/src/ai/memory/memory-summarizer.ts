import { getOpenAI } from "../orchestrator/openai";
import type { LearningProfile } from "./types";
import type { Message } from "../../domain/entities/message";

const SYSTEM_PROMPT = `You are an expert learning analyst.
Analyze the following conversation between a user and an AI research assistant.
Return a single JSON object with this exact shape and no markdown:

{
  "summary": "One sentence describing what the user is learning.",
  "learningTrajectory": "A short paragraph on how the user's understanding is evolving.",
  "strongAreas": ["topic A", "topic B"],
  "weakAreas": ["topic C", "topic D"],
  "recommendedFocus": ["topic E", "topic F"]
}

Be concise. Focus on conceptual understanding, not surface details.`;

export async function summarizeConversation(
  messages: readonly Message[]
): Promise<LearningProfile> {
  if (messages.length === 0) {
    return {
      summary: "",
      learningTrajectory: "",
      strongAreas: [],
      weakAreas: [],
      recommendedFocus: [],
    };
  }

  const openai = getOpenAI();

  const conversation = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: conversation },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty summarization response");
  }

  const parsed = JSON.parse(raw) as Partial<LearningProfile>;

  return {
    summary: parsed.summary ?? "",
    learningTrajectory: parsed.learningTrajectory ?? "",
    strongAreas: Array.isArray(parsed.strongAreas) ? parsed.strongAreas : [],
    weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : [],
    recommendedFocus: Array.isArray(parsed.recommendedFocus)
      ? parsed.recommendedFocus
      : [],
  };
}
