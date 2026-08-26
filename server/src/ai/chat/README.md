# Chat Pipeline

The chat pipeline powers Papermind's document Q&A experience. It uses the generic `Pipeline` engine to compose retrieval, reasoning, and generation stages.

## Stages

1. **Memory** — loads conversation history and persists the user's message.
2. **Retrieval** — builds a RAG context using the existing CRAG/hybrid retrieval service; optionally searches the web via Tavily when explicitly enabled.
3. **Reranking** — deduplicates and reranks retrieved chunks using the existing post-processing service.
4. **Context Builder** — concatenates ranked chunks into a single context string with source titles.
5. **Generation** — starts an OpenAI streamed chat completion constrained to the provided context.
6. **Streaming** — consumes the LLM stream and writes token events to the response.

## Progress Events

The pipeline emits structured NDJSON events so the UI can show live progress:

```ndjson
{"type":"progress","stage":"memory","status":"started"}
{"type":"progress","stage":"memory","status":"completed"}
{"type":"progress","stage":"retrieval","status":"started"}
{"type":"progress","stage":"retrieval","status":"completed"}
{"type":"progress","stage":"generation","status":"started"}
{"type":"token","delta":"Hello"}
{"type":"token","delta":" world"}
{"type":"progress","stage":"streaming","status":"completed"}
```

Event schema:

- `progress` — a pipeline stage started or completed.
  - `stage`: `memory | retrieval | reranking | context-builder | generation | streaming`
  - `status`: `started | completed`
- `token` — a streamed response token delta.
  - `delta`: string token fragment
- `error` — a stage failed.
  - `message`: error description

## Web Search

Tavily is isolated in `infrastructure/search/tavily-web-searcher.ts` and only runs when the request includes `enableWebSearch: true`. Normal document chat does not use the web.

## Testing

Run server tests:

```bash
cd server
npm test
```

## Architecture Notes

- Stages implement `PipelineStage<ChatState>`.
- `ChatState` extends `PipelineState` and carries immutable state through the pipeline.
- `progressWriter` and `streamWriter` are injected from the controller so the pipeline stays testable and framework-agnostic.
- The existing CRAG service, hybrid retrieval, and reranking services are reused without redesign.
