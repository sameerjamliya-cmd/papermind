import type { JsonObject } from "../../../domain/primitives/json-value";

export interface ExtractorInput {
  readonly title: string;
  readonly originalUrl: string;
  readonly metadata: JsonObject;
}

export interface Extractor {
  readonly name: string;
  extract(input: ExtractorInput): Promise<string>;
}