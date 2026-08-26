# Sprint 1: Upload & Storage

## Overview

This sprint implements file upload and persistence for the PaperMind knowledge base. Users can upload PDF, DOCX, Markdown, Image, and Audio files. The original file is stored in Cloudinary, and metadata is persisted to PostgreSQL as a `KnowledgeResource` with status `QUEUED`.

The upload endpoint returns `202 Accepted` immediately. The file is stored and a `KnowledgeResource` is created with status `uploaded`. An Inngest event is published to trigger the ingestion workflow asynchronously. No extraction, chunking, embeddings, or indexing is performed by the upload endpoint.

## Architecture

```
Express (Controller + multer)
    ↓
Application (UploadKnowledgeResourceUseCase)
    ↓
Domain (KnowledgeResource entity, ResourceType, KnowledgeResourceStatus)
    ↓
Infrastructure (CloudinaryFileStorage, PrismaKnowledgeResourceRepository, PrismaWorkspaceRepository)
```

- **Express** handles HTTP, file upload, and input validation.
- **Application** orchestrates workspace validation, file upload, and persistence.
- **Domain** defines the `KnowledgeResource` entity and related value objects/enums.
- **Infrastructure** contains Cloudinary and Prisma-specific code only.

## API Endpoint

### Upload a file

```http
POST /api/workspaces/:workspaceId/knowledge-resources
Content-Type: multipart/form-data
```

#### Request

| Field | Type     | Required | Description                       |
| ----- | -------- | -------- | --------------------------------- |
| file  | File     | Yes      | PDF, DOCX, Markdown, Image, Audio |
| title | string   | No       | Optional display title            |

#### Supported MIME types

| File type | MIME type                                                              | ResourceType |
| --------- | ---------------------------------------------------------------------- | ------------ |
| PDF       | `application/pdf`                                                      | `pdf`        |
| DOCX      | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `docx`       |
| Markdown  | `text/markdown`, `text/x-markdown`                                     | `markdown`   |
| Image     | `image/*`                                                              | `image`      |
| Audio     | `audio/*`                                                              | `audio`      |

#### Response

```http
HTTP/1.1 202 Accepted
Content-Type: application/json
```

```json
{
  "data": {
    "id": "<resource-id>",
    "workspaceId": "<workspace-id>",
    "userId": "<user-id>",
    "type": "pdf",
    "status": "uploaded",
    "title": "Annual Report",
    "originalUrl": "https://res.cloudinary.com/.../file.pdf",
    "publicId": "papermind/resources/...",
    "metadata": {
      "filename": "report.pdf",
      "mimeType": "application/pdf",
      "size": 1024
    },
    "createdAt": "2026-08-06T00:00:00.000Z",
    "updatedAt": "2026-08-06T00:00:00.000Z"
  }
}
```

## File storage mapping

Cloudinary `resource_type` is selected based on `ResourceType`:

- `pdf`, `docx`, `markdown` → `raw`
- `image` → `image`
- `audio` → `video`

Files are uploaded to the `papermind/resources` folder.

## Environment variables

| Variable                  | Required | Description               |
| ------------------------- | -------- | ------------------------- |
| `CLOUDINARY_CLOUD_NAME`   | Yes      | Cloudinary cloud name     |
| `CLOUDINARY_API_KEY`      | Yes      | Cloudinary API key        |
| `CLOUDINARY_API_SECRET`   | Yes      | Cloudinary API secret     |
| `DATABASE_URL`            | Yes      | PostgreSQL connection URL |

## Running tests

```bash
cd server
npm test
```

Tests cover:

- Successful upload and `QUEUED` resource creation
- Workspace not found returns `NotFoundError`
- Workspace ownership mismatch returns `ForbiddenError`

## Out of scope

The following are intentionally not implemented in this sprint:

- Content extraction (PDF, DOCX, OCR, Whisper)
- Text/markdown normalization
- Chunking
- Embeddings
- Vector indexing (Pinecone)
- Web scraping (Firecrawl)
- Web search (Tavily)
- Async job processing (Inngest)
- BM25 / keyword indexing

These will be handled in subsequent sprints.
