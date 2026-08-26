import { z } from "zod";
import { logger } from "../lib/logger";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),

  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  FIRECRAWL_API_KEY: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),

  MEM0_API_KEY: z.string().optional(),
  MEMORY_SYNC_MESSAGE_THRESHOLD: z.coerce.number().default(10),
  MEMORY_SUMMARY_MESSAGE_WINDOW: z.coerce.number().default(20),

  INNGEST_SIGNING_KEY: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),

  KOKORO_TTS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env;

export function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    logger.error("Invalid environment variables", parsed.error.format());
    process.exit(1);
  }
  _env = parsed.data;

  const optionalKeys = [
    "OPENAI_API_KEY",
    "PINECONE_API_KEY",
    "CLOUDINARY_API_KEY",
    "FIRECRAWL_API_KEY",
    "TAVILY_API_KEY",
    "MEM0_API_KEY",
  ] as const;
  const missing = optionalKeys.filter((k) => !_env[k]);
  if (missing.length > 0) {
    logger.warn(`Optional integrations not configured: ${missing.join(", ")}`);
  }

  return _env;
}

export function getEnv(): Env {
  if (!_env) {
    throw new Error("Environment not loaded. Call loadEnv() first.");
  }
  return _env;
}
