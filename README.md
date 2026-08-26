# Papermind

Papermind is an AI research and study workspace. You drop in documents,
websites, YouTube links, or your own notes, and Papermind ingests them into a
per-workspace knowledge base you can chat with, quiz yourself on, and turn
into flashcards, infographics, and narrated audio overviews — all grounded in
your sources, with citations back to the exact passage an answer came from.

## What it does

- **Workspaces & collections** — organize sources into notebooks and group
  related sources into collections.
- **Source ingestion** — add PDFs, websites, YouTube videos, raw text/markdown,
  or web-search results. Each source is chunked, embedded, and indexed for
  retrieval; ingestion status (`pending → processing → ready`) is tracked so
  the UI can reflect progress.
- **RAG chat** — ask questions about your workspace and get streamed answers
  with inline source citations, backed by vector retrieval, reranking, and a
  context-building pipeline.
- **Content generation** — turn your sources into:
  - **Quizzes** (multiple choice, true/false, fill-in-the-blank, short answer)
    with AI-graded, feedback-rich scoring.
  - **Flashcard decks** with hints and source references per card.
  - **Infographics** in multiple visual styles and languages.
  - **Audio overviews** — a two-host narrated "podcast" summary of your
    sources, synthesized with text-to-speech.
- **Long-term memory** — the chat pipeline periodically summarizes
  conversations into a per-user learning profile, so context persists across
  sessions.
- **Auth** — Google OAuth via Better Auth.

## Architecture

| Layer | Technology |
|-------|-----------|
| Backend | Express + TypeScript |
| ORM | Prisma + PostgreSQL |
| Auth | Better Auth + Google OAuth |
| AI / LLM | OpenAI |
| AI Streaming | Vercel AI SDK |
| Vector DB | Pinecone |
| File Storage | Cloudinary |
| Web Scraping | Firecrawl |
| Web Search | Tavily |
| Background Jobs | Inngest |
| Long-term Memory | Mem0 |
| Text-to-Speech | Kokoro-82M (self-hosted FastAPI microservice) |
| Frontend | Next.js (App Router) |
| UI | shadcn/ui |
| Server State | TanStack Query |
| Client State | Zustand |

```
papermind/
├── server/            # Express API — auth, workspaces, sources, RAG chat,
│                        generation (quiz/flashcards/infographics/audio),
│                        Inngest background workers
│   └── tts-service/   # Standalone Kokoro TTS microservice (FastAPI)
├── client/            # Next.js dashboard UI
├── docker-compose.yml # Local PostgreSQL
└── DEPLOY.md          # Production deployment runbook (Vercel + Railway + Cloud Run)
```

### Key data flows

**Source ingestion:** upload/scrape → recursive text chunking with overlap →
OpenAI embeddings → chunk metadata in Postgres, vectors in Pinecone → Inngest
processes this asynchronously and flips the source to `ready`.

**RAG chat:** embed the question → Pinecone similarity search → rerank →
build context → streamed OpenAI completion → citations mapped back to source
chunks.

**Content generation:** quiz/flashcard/infographic/audio-overview requests are
queued as Inngest events; a background function retrieves relevant chunks,
prompts OpenAI for structured output, and (for audio) synthesizes narration
via the Kokoro TTS service before uploading the final file to Cloudinary.

## Getting started

```bash
# Start PostgreSQL
docker compose up -d

# Server
cd server && npm install && npm run dev

# Client
cd client && npm install && npm run dev
```

Copy `.env.example` into `server/.env` and `client/.env.local` and fill in the
required keys (Google OAuth, OpenAI, Pinecone are required for the core
features; Cloudinary, Firecrawl, Tavily, and Mem0 are optional and gate
specific features if left unset).

The `dev` script sets `NODE_ENV=development INNGEST_DEV=1` so the Inngest SDK
talks to the local dev CLI (`npm run inngest:dev`) instead of expecting a
production event key.

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full production runbook: PostgreSQL +
API server on Railway, client on Vercel, background jobs on Inngest Cloud,
and the TTS microservice on Google Cloud Run.
