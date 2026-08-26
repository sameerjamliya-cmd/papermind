# Sprint 2: Inngest Ingestion Workflow

## Overview

After a file is uploaded and stored as a `KnowledgeResource` with status `UPLOADED`, an Inngest event is published. Inngest picks up the event and runs an ingestion workflow that advances the resource through its lifecycle:

```
UPLOADED → QUEUED → PROCESSING → READY
                              ↘ FAILED
```

The workflow executes a placeholder ingestion pipeline using the existing generic Pipeline Engine. No real parsing, chunking, embedding, or indexing is performed in this sprint.

## Status lifecycle

| Status      | Meaning                                     |
| ----------- | ------------------------------------------- |
| `uploaded`  | File uploaded to Cloudinary and persisted   |
| `queued`    | Ingestion job received by Inngest           |
| `processing`| Ingestion pipeline is running               |
| `ready`     | Ingestion pipeline completed successfully   |
| `failed`    | Ingestion pipeline failed                   |

## Inngest workflow

Function ID: `process-knowledge-resource`

Trigger: `knowledge-resource.created`

Steps:

1. **fetch-resource** — load `KnowledgeResource` from database
2. **mark-queued** — update status to `QUEUED`
3. **mark-processing** — update status to `PROCESSING`
4. **run-ingestion-pipeline** — execute `IngestionPipeline`
5. **mark-ready** — update status to `READY`
6. **mark-failed** — update status to `FAILED` on error

## Ingestion pipeline

Built on the generic `Pipeline<IngestionState>` engine.

Stages (all placeholder logic):

| Stage          | Output field                  | Placeholder behavior                |
| -------------- | ----------------------------- | ----------------------------------- |
| `validation`   | —                             | passes state through                |
| `extraction`   | `content`                     | placeholder string                  |
| `normalization`| `normalizedContent`           | trims extracted content             |
| `chunking`     | `chunks`                      | single chunk with all content       |
| `embedding`    | `embeddings`                  | single dummy vector `[0.1,0.2,0.3]` |
| `indexing`     | —                             | passes state through                |
| `persistence`  | —                             | passes state through                |

## IngestionState

```ts
interface IngestionState extends PipelineState {
  resourceId: ResourceId;
  workspaceId: WorkspaceId;
  userId: UserId;
  title: string;
  type: ResourceType;
  originalUrl: string;
  publicId: string;
  status: KnowledgeResourceStatus;
  content: string | null;
  normalizedContent: string | null;
  chunks: readonly IngestionChunk[];
  embeddings: ReadonlyArray<readonly number[]> | null;
  error: string | null;
}
```

## Upload changes from Sprint 1

- After persisting the `KnowledgeResource`, the upload use case now publishes a `knowledge-resource.created` Inngest event.
- The initial status is `uploaded` instead of `queued`.
- An `EventPublisher` port abstracts the event bus so the application layer does not depend on Inngest directly.

## Local development

Start the Inngest dev server:

```bash
cd server
npm run inngest:dev
```

Then start the API:

```bash
npm run dev
```

## Running tests

```bash
cd server
npm test
```

Tests cover:

- Upload publishes the Inngest event and sets status to `uploaded`
- Pipeline runs all 7 stages end-to-end with placeholder output
- Workspace not found / forbidden error handling

## Out of scope

- Real PDF/DOCX/Markdown/Image/Audio parsing
- Real text normalization
- Real chunking strategies
- Real embedding generation
- Real vector indexing (Pinecone)
- Real persistence of chunks/embeddings
- Firecrawl / Tavily / web sources
- BM25 / keyword indexing
