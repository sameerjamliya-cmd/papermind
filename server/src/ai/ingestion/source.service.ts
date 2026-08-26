import { NotFoundError, ForbiddenError } from "../../types/app-error";
import { sourceRepository } from "../../repository/source.repository";
import { workspaceRepository } from "../../repository/workspace.repository";
import { deletePdf } from "../../lib/cloudinary";
import { scrapeWebsite } from "./firecrawl";
import { inngest } from "../../inngest/client";
import { prisma } from "../../lib/db";
import { extractStructuredPdf } from "./extractors/structured-pdf-extractor";
import type { Source, Prisma } from "../../generated/prisma";
import type {
  AddSourceInput,
  ListSourcesQuery,
  BulkDeleteSourcesInput,
} from "../../validator/source-validator";

async function getOwnedWorkspace(workspaceId: string, userId: string) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found");
  if (workspace.userId !== userId) throw new ForbiddenError();
  return workspace;
}

async function getOwnedSource(sourceId: string, workspaceId: string) {
  const source = await sourceRepository.findById(sourceId);
  if (!source) throw new NotFoundError("Source not found");
  if (source.workspaceId !== workspaceId) throw new ForbiddenError();
  return source;
}

export const sourceService = {
  async addSource(
    workspaceId: string,
    userId: string,
    input: AddSourceInput,
    file?: Express.Multer.File
  ) {
    await getOwnedWorkspace(workspaceId, userId);

    switch (input.type) {
      case "pdf": {
        if (!file) throw new Error("PDF file is required");

        let structured;
        try {
          structured = await extractStructuredPdf(file.buffer);
        } catch (err) {
          console.error("[source-service] structured PDF extraction failed, falling back:", err);
          structured = { fullText: "", pages: [] };
        }

        const created = await sourceRepository.create({
          type: input.type,
          title: input.title || file.originalname.replace(/\.pdf$/i, ""),
          content: structured.fullText || "",
          status: "pending",
          metadata: {
            filename: file.originalname,
            pages: structured.pages,
            extractionMethod: structured.fullText ? "structured" : "fallback",
          } as unknown as Prisma.InputJsonValue,
          workspace: { connect: { id: workspaceId } },
          user: { connect: { id: userId } },
        });
        await inngest.send({
          name: "source.created",
          data: { sourceId: created.id, workspaceId },
        });
        return created;
      }

      case "website": {
        const scraped = await scrapeWebsite(input.url);
        const created = await sourceRepository.create({
          type: input.type,
          title: input.title || scraped.title,
          url: input.url,
          content: scraped.markdown,
          status: "pending",
          metadata: scraped.metadata,
          workspace: { connect: { id: workspaceId } },
          user: { connect: { id: userId } },
        });
        await inngest.send({
          name: "source.created",
          data: { sourceId: created.id, workspaceId },
        });
        return created;
      }

      case "text":
      case "markdown": {
        const created = await sourceRepository.create({
          type: input.type,
          title: input.title,
          content: input.content,
          status: "pending",
          workspace: { connect: { id: workspaceId } },
          user: { connect: { id: userId } },
        });
        await inngest.send({
          name: "source.created",
          data: { sourceId: created.id, workspaceId },
        });
        return created;
      }

      case "youtube": {
        const created = await sourceRepository.create({
          type: input.type,
          title: input.title || input.url,
          url: input.url,
          status: "pending",
          workspace: { connect: { id: workspaceId } },
          user: { connect: { id: userId } },
        });
        await inngest.send({
          name: "source.created",
          data: { sourceId: created.id, workspaceId },
        });
        return created;
      }

      case "websearch": {
        const created = await sourceRepository.create({
          type: input.type,
          title: input.query,
          status: "pending",
          metadata: {
            query: input.query,
            maxResults: input.maxResults,
            searchDepth: input.searchDepth,
          },
          workspace: { connect: { id: workspaceId } },
          user: { connect: { id: userId } },
        });
        await inngest.send({
          name: "source.created",
          data: { sourceId: created.id, workspaceId },
        });
        return created;
      }
    }
  },

  async listSources(workspaceId: string, userId: string, query: ListSourcesQuery) {
    await getOwnedWorkspace(workspaceId, userId);
    const { sources, total } = await sourceRepository.findAllByWorkspace(workspaceId, query);
    const { page, limit } = query;
    return {
      data: sources,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getSource(workspaceId: string, sourceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    return getOwnedSource(sourceId, workspaceId);
  },

  async updateSource(
    workspaceId: string,
    sourceId: string,
    userId: string,
    data: { title?: string; status?: string; errorMessage?: string; chunkCount?: number }
  ) {
    await getOwnedWorkspace(workspaceId, userId);
    await getOwnedSource(sourceId, workspaceId);
    return sourceRepository.update(sourceId, data);
  },

  async deleteSource(workspaceId: string, sourceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    const source = await getOwnedSource(sourceId, workspaceId);

    if (source.type === "pdf" && source.metadata) {
      const meta = source.metadata as { publicId?: string };
      if (meta.publicId) {
        await deletePdf(meta.publicId).catch(() => {});
      }
    }

    return sourceRepository.delete(sourceId);
  },

  async bulkDelete(workspaceId: string, userId: string, input: BulkDeleteSourcesInput) {
    await getOwnedWorkspace(workspaceId, userId);

    const sources: (Source | null)[] = await Promise.all(
      input.sourceIds.map((id) => sourceRepository.findById(id))
    );

    for (const source of sources) {
      if (!source) throw new NotFoundError("Source not found");
      if (source.workspaceId !== workspaceId) throw new ForbiddenError();
    }

    for (const source of sources) {
      if (source!.type === "pdf" && source!.metadata) {
        const meta = source!.metadata as { publicId?: string };
        if (meta.publicId) {
          await deletePdf(meta.publicId).catch(() => {});
        }
      }
    }

    await sourceRepository.bulkDelete(input.sourceIds);
    return { deleted: input.sourceIds.length };
  },

  async listAllSourcesByUser(userId: string, query: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = query;
    const where: Record<string, unknown> = { userId };
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [sources, total] = await Promise.all([
      prisma.source.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: { workspace: { select: { id: true, title: true } } },
      }),
      prisma.source.count({ where }),
    ]);

    return {
      data: sources,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },
};