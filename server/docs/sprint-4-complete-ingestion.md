# Sprint 4: Complete Ingestion

## Overview

This sprint completes the ingestion pipeline by replacing the placeholder chunking, embedding, indexing, and persistence stages with real implementations.

The ingestion workflow now:

1. Extracts normalized text
2. Chunks text semantically
3. Generates embeddings
4. Uploads vectors to Pinecone
5. Persists chunk metadata to PostgreSQL
6. Updates `KnowledgeResource` status to `READY` and records `chunkCount`

## Pipeline stages

| Stage          | Responsibility                              | Implementation                             |
| -------------- | ------------------------------------------- | ------------------------------------------ |
| `validation`   | Validate ingestion input                    | Placeholder                                |
| `extraction`   | Extract normalized text from source         | Type-specific extractors (Sprint 3)        |
| `normalization`| Normalize extracted text                    | Trim whitespace                            |
| `chunking`     | Split text into semantic chunks             | `recursiveChunk` (paragraph/sentence/word) |
| `embedding`    | Generate vector embeddings for chunks       | `OpenAIEmbedder`                           |
| `indexing`     | Upload vectors to vector store              | `PineconeVectorIndexer`                    |
| `persistence`  | Store chunk metadata and embeddings in DB   | `PrismaKnowledgeResourceChunkRepository`   |

## New ports

- `Embedder` — `embed(texts)` → embeddings
- `VectorIndexer` — `index({ resourceId, workspaceId, chunks })`
- `KnowledgeResourceChunkRepository` — `createMany(chunks)`

## New infrastructure

| File                                                      | Responsibility                          |
| --------------------------------------------------------- | --------------------------------------- |
| `infrastructure/embedders/openai-embedder.ts`             | Implements `Embedder` via `generateEmbeddings` wrapper |
| `infrastructure/vector-store/pinecone-client.ts`          | Low-level Pinecone client (`getPineconeIndex`, `upsertVectors`) |
| `infrastructure/vector-store/pinecone-vector-indexer.ts`  | Implements `VectorIndexer` for ingestion |
| `infrastructure/persistence/prisma-knowledge-resource-chunk-repository.ts` | Persists chunks with embeddings as JSON |

## Pinecone isolation

Pinecone SDK is used only in `infrastructure/vector-store/pinecone-client.ts`. The retrieval layer's existing Pinecone code remains untouched.

## OpenAI wrapper

`OpenAIEmbedder` delegates to the existing `ai/orchestrator/openai.ts` `generateEmbeddings` function. No new OpenAI client code was written.

## Database schema

Added:

- `KnowledgeResource.chunkCount`
- `KnowledgeResource.chunks` relation
- `KnowledgeResourceChunk` model

## Inngest workflow updates

After pipeline success, the workflow now updates the resource with:

```ts
{
  status: KnowledgeResourceStatus.Ready,
  chunkCount: result.state.chunks.length,
}
```

On failure, status becomes `failed` and `errorMessage` is recorded.

## Status lifecycle

```
UPLOADED → QUEUED → PROCESSING → READY
                              ↘ FAILED
```

`READY` is the terminal success state for completed ingestion.

## Running tests

```bash
cd server
npm test
```

Tests cover:

- Full pipeline produces chunks, embeddings, and calls indexer + repository
- Semantic chunking splits long text and returns empty for empty input
- All extractors behave correctly
- Upload use case publishes event and sets `uploaded` status

## Out of scope

- Retrieval logic changes
- CRAG changes
- Prompt changes
- Real PDF/YouTube/Audio/Image parsing (still placeholders)
- Chunk content search/reranking
