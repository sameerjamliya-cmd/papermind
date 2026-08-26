# Papermind — Tech Stack & Architecture

A NotebookLM clone for AI-powered document research, Q&A, and content generation.

## Stack

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
| Frontend | Next.js (App Router) |
| UI | shadcn/ui |
| Server State | TanStack Query |
| Client State | Zustand |

## Project Structure

```
papermind/
├── server/                    # Express backend
│   ├── src/
│   │   ├── index.ts           # entry point
│   │   ├── app.ts             # express app setup
│   │   ├── config/env.ts      # env vars & constants
│   │   ├── db/prisma/         # schema + migrations
│   │   ├── lib/               # auth, pinecone, cloudinary, firecrawl, tavily, openai, inngest
│   │   ├── ai/                # ingestion, chat pipeline, memory, generation
│   │   ├── middleware/        # auth, error
│   │   ├── services/          # ingestion, chunking, embedding, rag, generation
│   │   ├── routes/            # auth, notebooks, sources, chat, generation, notes
│   │   ├── validator/         # Zod request validation schemas
│   │   └── types/index.ts     # shared type definitions
│   ├── package.json
│   └── tsconfig.json
│
├── client/                    # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── auth/          # login, register (Google OAuth)
│   │   │   └── dashboard/notebook/[id]/  # notebook workspace
│   │   ├── components/
│   │   │   ├── ui/            # shadcn
│   │   │   ├── chat/          # chat-panel, message-bubble, citation-popover
│   │   │   ├── sources/       # source-uploader, source-list
│   │   │   ├── notes/         # note-editor, note-list
│   │   │   └── generation/    # generate-menu
│   │   ├── stores/            # Zustand stores
│   │   ├── hooks/             # TanStack Query hooks
│   │   └── lib/               # api client, shared types
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml         # PostgreSQL
├── .env.example
└── AGENTS.md
```

## Key Data Flows

### Source Ingestion
1. Upload file → Cloudinary
2. Firecrawl scrape (for URLs)
3. Recursive text chunking with overlap
4. OpenAI embed chunks
5. Store metadata in Postgres + vectors in Pinecone
6. Inngest handles async processing

### RAG Chat
1. OpenAI embed question
2. Pinecone vector similarity search (top-k)
3. Build context → OpenAI chat completion (AI SDK streaming)
4. Return streamed answer + source citations

### Content Generation
1. Retrieve all chunks for a source from Pinecone
2. Prompt-templated OpenAI completion
3. Return structured output (summary, FAQ, study guide, timeline, briefing doc)

### Conversation Memory Sync
1. Chat controller counts messages since last sync (`MemorySync` table)
2. When threshold is reached, send `conversation.memory.sync` Inngest event
3. Inngest function fetches unsynced messages, summarizes them into a learning profile
4. Store the formatted memory in Mem0 keyed by `user_id`
5. Chat pipeline retrieves the latest memory and injects it into the system prompt

## Setup

```bash
# Start PostgreSQL
docker compose up -d

# Server
cd server && npm install && npm run dev

# Client
cd client && npm install && npm run dev
```

## Environment Variables

See `.env.example` for all required environment variables.

Key server variables for memory:
- `MEM0_API_KEY`
- `MEMORY_SYNC_MESSAGE_THRESHOLD` (default: 10)
- `MEMORY_SUMMARY_MESSAGE_WINDOW` (default: 20)
