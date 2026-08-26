import { describe, it, expect, vi } from "vitest";
import { UploadKnowledgeResourceUseCase } from "./upload-knowledge-resource.use-case";
import { ResourceType } from "../../domain/enums/resource-type";
import { KnowledgeResourceStatus } from "../../domain/enums/knowledge-resource-status";
import {
  createWorkspaceId,
  createUserId,
} from "../../domain/primitives/brand";
import { NotFoundError, ForbiddenError } from "../../types/app-error";
import type { Workspace } from "../../domain";

function makeWorkspace(overrides?: Partial<Workspace>): Workspace {
  return {
    id: createWorkspaceId("ws-1"),
    userId: createUserId("user-1"),
    title: "Test Workspace",
    description: null,
    icon: null,
    chatModel: "gpt-4o-mini",
    createdAt: "2026-08-06T00:00:00.000Z",
    updatedAt: "2026-08-06T00:00:00.000Z",
    ...overrides,
  };
}

function makeUseCase(deps?: {
  workspace?: Workspace | null;
  uploadedUrl?: string;
  uploadedPublicId?: string;
}) {
  const workspace =
    deps && "workspace" in deps ? deps.workspace : makeWorkspace();
  const fileStorage = {
    upload: vi.fn().mockResolvedValue({
      url: deps?.uploadedUrl ?? "https://cloudinary.test/file.pdf",
      publicId: deps?.uploadedPublicId ?? "papermind/resources/test-file",
    }),
    delete: vi.fn(),
  };
  const knowledgeResourceRepository = {
    create: vi.fn().mockImplementation((r) => Promise.resolve(r)),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    update: vi.fn(),
  };
  const workspaceRepository = {
    findById: vi.fn().mockResolvedValue(workspace ?? null),
  };
  const eventPublisher = {
    publish: vi.fn().mockResolvedValue(undefined),
  };

  const useCase = new UploadKnowledgeResourceUseCase(
    fileStorage,
    knowledgeResourceRepository,
    workspaceRepository,
    eventPublisher
  );

  return {
    useCase,
    fileStorage,
    knowledgeResourceRepository,
    workspaceRepository,
    eventPublisher,
  };
}

describe("UploadKnowledgeResourceUseCase", () => {
  it("uploads file, persists resource with status Uploaded, and enqueues event", async () => {
    const { useCase, fileStorage, knowledgeResourceRepository, eventPublisher } =
      makeUseCase();

    const result = await useCase.execute({
      workspaceId: createWorkspaceId("ws-1"),
      userId: createUserId("user-1"),
      title: "Annual Report",
      type: ResourceType.Pdf,
      file: {
        buffer: Buffer.from("pdf-content"),
        filename: "report.pdf",
        mimeType: "application/pdf",
        size: 1024,
      },
    });

    expect(result.status).toBe(KnowledgeResourceStatus.Uploaded);
    expect(result.title).toBe("Annual Report");
    expect(result.type).toBe(ResourceType.Pdf);
    expect(result.originalUrl).toBe("https://cloudinary.test/file.pdf");
    expect(result.publicId).toBe("papermind/resources/test-file");
    expect(result.metadata).toEqual({
      filename: "report.pdf",
      mimeType: "application/pdf",
      size: 1024,
    });

    expect(fileStorage.upload).toHaveBeenCalledOnce();
    expect(fileStorage.upload).toHaveBeenCalledWith({
      buffer: Buffer.from("pdf-content"),
      filename: "report.pdf",
      mimeType: "application/pdf",
      resourceType: ResourceType.Pdf,
    });
    expect(knowledgeResourceRepository.create).toHaveBeenCalledOnce();
    expect(eventPublisher.publish).toHaveBeenCalledOnce();
    expect(eventPublisher.publish).toHaveBeenCalledWith({
      name: "knowledge-resource.created",
      data: {
        resourceId: result.id,
        workspaceId: result.workspaceId,
      },
    });
  });

  it("throws NotFoundError when workspace does not exist", async () => {
    const { useCase } = makeUseCase({ workspace: null });

    await expect(
      useCase.execute({
        workspaceId: createWorkspaceId("ws-missing"),
        userId: createUserId("user-1"),
        title: "Report",
        type: ResourceType.Pdf,
        file: {
          buffer: Buffer.from("content"),
          filename: "report.pdf",
          mimeType: "application/pdf",
          size: 100,
        },
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ForbiddenError when user does not own the workspace", async () => {
    const { useCase } = makeUseCase({
      workspace: makeWorkspace({ userId: createUserId("other-user") }),
    });

    await expect(
      useCase.execute({
        workspaceId: createWorkspaceId("ws-1"),
        userId: createUserId("user-1"),
        title: "Report",
        type: ResourceType.Pdf,
        file: {
          buffer: Buffer.from("content"),
          filename: "report.pdf",
          mimeType: "application/pdf",
          size: 100,
        },
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});