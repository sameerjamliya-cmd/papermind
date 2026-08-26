import OpenAI from "openai";
import { getEnv } from "../../config/env";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_client) return _client;
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }
  _client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return _client;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename = "audio.webm"
): Promise<string> {
  const openai = getOpenAI();
  const file = await OpenAI.toFile(audioBuffer, filename);
  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
    response_format: "text",
  });
  return transcription as unknown as string;
}
