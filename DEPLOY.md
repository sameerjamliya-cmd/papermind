# Papermind — Deployment Runbook (Vercel + Railway)

## Architecture

| Component | Platform | Notes |
|-----------|----------|-------|
| Postgres | Railway | Provision via Railway database plugin |
| API server | Railway | Node monorepo root: `server/` |
| Client | Vercel | Next.js, root: `client/` |
| Background jobs | Inngest Cloud | Syncs with `<server-url>/api/inngest` |
| File storage | Cloudinary | SaaS, no hosting needed |

---

## 1. Prerequisites (accounts & keys you must obtain)

- [ ] Cloudinary account → `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] Firecrawl account → `FIRECRAWL_API_KEY`
- [ ] Tavily account → `TAVILY_API_KEY`
- [ ] Inngest Cloud account → `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`
- [ ] Your domain name(s) for client and/or API
- [ ] Generate auth secret locally: `openssl rand -base64 32`

## 2. Postgres on Railway

1. New Project → Add **PostgreSQL**
2. Copy the **public** connection string (`postgresql://...`)
3. Note it as `$DATABASE_URL`

## 3. API Server on Railway

1. New Service → **GitHub Repo** → root directory: `server`
2. Build command: `npx prisma generate && npm run build`
3. Start command: `node dist/index.js`
4. Environment variables:

```env
DATABASE_URL=<railway postgres url>
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://<api-domain>            # or railway URL if no custom domain
GOOGLE_CLIENT_ID=<same as local>
GOOGLE_CLIENT_SECRET=<same as local>
CLIENT_URL=https://<client-domain>,https://www.<client-domain>
OPENAI_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FIRECRAWL_API_KEY=...
TAVILY_API_KEY=...
MEM0_API_KEY=...
INNGEST_SIGNING_KEY=...
NODE_ENV=production
LOG_LEVEL=info
```

5. Deploy, then run migrations once (Railway shell or locally against prod DB):

```bash
DATABASE_URL="<railway postgres url>" npx prisma migrate deploy
```

6. Verify: `curl https://<api-domain>/health` → `{"status":"ok","database":"up"}`

## 4. Inngest Cloud

1. Create app in Inngest Cloud dashboard
2. Set the app's serve URL to: `https://<api-domain>/api/inngest`
3. Copy the **Signing Key** into Railway env (`INNGEST_SIGNING_KEY`) and redeploy
4. Copy the **Event Key** into Railway env (`INNGEST_EVENT_KEY`) — required for `inngest.send()` from your API
5. Verify all 7 functions appear as registered in the dashboard

## 5. Client on Vercel

1. Import the GitHub repo into Vercel, root directory: `client`
2. Framework preset: Next.js (build command defaults are fine)
3. Environment variables:

```env
NEXT_PUBLIC_API_URL=https://<api-domain>
```

4. Deploy → note the domain(s); update `CLIENT_URL` on Railway to include them and redeploy server

## 6. Google OAuth

In Google Cloud Console → Credentials → OAuth client:

Add Authorized JavaScript origins:
- `https://<client-domain>`
- `https://<api-domain>` (if different)

Add Authorized redirect URIs:
- `https://<api-domain>/api/auth/callback/google`
- `http://localhost:3001/api/auth/callback/google` (keep for local dev)

## 7. End-to-end verification checklist

- [ ] `/health` returns ok
- [ ] Google login works from the prod client domain
- [ ] Create workspace / collection
- [ ] Upload file source → status becomes READY (exercises Cloudinary + OpenAI + Pinecone + Inngest)
- [ ] Add URL source (exercises Firecrawl)
- [ ] RAG chat answers with citations
- [ ] Generate summary/quiz/flashcards/audio overview
- [ ] Web search in chat (Tavily) if used
- [ ] Sign out / sign back in; session persists across restarts

## Local development

Unchanged — see AGENTS.md. `INNGEST_SIGNING_KEY` stays unset locally so the
SDK runs against the local dev server CLI (`npm run inngest:dev`).
