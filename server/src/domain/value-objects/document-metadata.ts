import type { SourceType } from "../enums/source-type";
import type { JsonObject } from "../primitives/json-value";

export interface DocumentMetadata {
  readonly sourceType: SourceType;
  readonly title: string;
  readonly description?: string;
  readonly sourceUrl?: string;
  readonly language?: string;
  readonly author?: string;
  readonly publishedAt?: string; // ISO-8601
  readonly extra: JsonObject;
}