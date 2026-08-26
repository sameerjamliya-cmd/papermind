import { z } from "zod";
import { INFOGRAPHIC_STYLE_IDS } from "../ai/infographic/styles";
import { INFOGRAPHIC_LANGUAGE_CODES } from "../ai/infographic/languages";
import type { InfographicLanguage, InfographicStyleId } from "../types";

export const infographicStyleIdSchema = z.enum(
  INFOGRAPHIC_STYLE_IDS as unknown as [InfographicStyleId, ...InfographicStyleId[]]
);

export const infographicLanguageSchema = z.enum(
  INFOGRAPHIC_LANGUAGE_CODES as unknown as [
    InfographicLanguage,
    ...InfographicLanguage[]
  ]
);

export const generateInfographicSchema = z.object({
  styleId: infographicStyleIdSchema,
  language: infographicLanguageSchema,
  prompt: z.string().trim().max(500).optional(),
  regenerate: z.boolean().optional(),
});

export const infographicIdParamSchema = z.object({
  infographicId: z.string().uuid(),
});

export type GenerateInfographicInput = z.infer<typeof generateInfographicSchema>;