import type { InfographicLanguage } from "@/lib/types";

export interface InfographicLanguageMeta {
  code: InfographicLanguage;
  label: string;
  nativeName: string;
  fontScript: string;
}

export const INFOGRAPHIC_LANGUAGES: InfographicLanguageMeta[] = [
  { code: "en", label: "English", nativeName: "English", fontScript: "latin" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी", fontScript: "devanagari" },
  { code: "ta", label: "Tamil", nativeName: "தமிழ்", fontScript: "tamil" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు", fontScript: "telugu" },
  { code: "kn", label: "Kannada", nativeName: "ಕನ್ನಡ", fontScript: "kannada" },
  { code: "ml", label: "Malayalam", nativeName: "മലയാളം", fontScript: "malayalam" },
  { code: "mr", label: "Marathi", nativeName: "मराठी", fontScript: "devanagari" },
  { code: "gu", label: "Gujarati", nativeName: "ગુજરાતી", fontScript: "gujarati" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা", fontScript: "bengali" },
  { code: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ", fontScript: "gurmukhi" },
];

export function getLanguageMeta(code: InfographicLanguage) {
  const lang = INFOGRAPHIC_LANGUAGES.find((l) => l.code === code);
  if (!lang) throw new Error(`Unsupported infographic language: ${code}`);
  return lang;
}