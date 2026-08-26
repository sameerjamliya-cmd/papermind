# Sprint 3: Extraction Layer

## Overview

This sprint introduces provider-specific extractors that turn a `KnowledgeResource` into normalized text. The extraction stage of the ingestion pipeline dispatches to the correct extractor based on `ResourceType`.

## Supported sources

| Source     | Extractor             | Real implementation? |
| ---------- | --------------------- | -------------------- |
| PDF        | `PdfExtractor`        | Placeholder only     |
| Website    | `WebsiteExtractor`    | Uses Firecrawl       |
| YouTube    | `YoutubeExtractor`    | Placeholder only     |
| Audio      | `AudioExtractor`      | Placeholder only     |
| Image      | `ImageExtractor`      | Placeholder only     |
| Markdown   | `MarkdownExtractor`   | Placeholder only     |

## Extractor interface

```ts
export interface Extractor {
  readonly name: string;
  extract(input: ExtractorInput): Promise<string>;
}
```

Each extractor receives:

- `title` — resource title
- `originalUrl` — Cloudinary URL for uploaded files
- `metadata` — resource metadata bag

And returns normalized text.

## Architecture

```
ai/ingestion/extractors/
├── extractor.ts              # interface
├── web-scraper.ts            # WebScraper port
├── pdf-extractor.ts
├── website-extractor.ts      # depends on WebScraper
├── youtube-extractor.ts
├── audio-extractor.ts
├── image-extractor.ts
└── markdown-extractor.ts

infrastructure/scraping/
├── firecrawl-client.ts       # Firecrawl SDK usage
└── firecrawl-web-scraper.ts  # implements WebScraper
```

Firecrawl SDK is isolated in `infrastructure/scraping/firecrawl-client.ts`.
`WebsiteExtractor` depends only on the `WebScraper` interface.

## Website extraction

`WebsiteExtractor` reads `metadata.sourceUrl`. If present, it calls the `WebScraper` and returns trimmed markdown. If absent, it returns placeholder text.

## Extraction stage

`ExtractionStage` maintains a registry mapping each `ResourceType` to its extractor:

```ts
{
  [ResourceType.Pdf]: new PdfExtractor(),
  [ResourceType.Website]: new WebsiteExtractor(webScraper),
  [ResourceType.Youtube]: new YoutubeExtractor(),
  [ResourceType.Audio]: new AudioExtractor(),
  [ResourceType.Image]: new ImageExtractor(),
  [ResourceType.Markdown]: new MarkdownExtractor(),
}
```

The `IngestionPipeline` accepts an optional `webScraper` dependency. In production, the Inngest workflow injects `FirecrawlWebScraper`. In tests, a mock can be injected.

## Out of scope

- Real PDF parsing
- Real YouTube transcript extraction
- Real audio transcription (Whisper)
- Real image OCR
- Real markdown parsing
- Chunking
- Embeddings
- Indexing

## Running tests

```bash
cd server
npm test
```

Tests cover:

- All six extractors return normalized placeholder text
- `WebsiteExtractor` delegates to `WebScraper` when `sourceUrl` is present
- `WebsiteExtractor` returns placeholder when `sourceUrl` is absent
- Pipeline dispatches extractors and produces typed output
