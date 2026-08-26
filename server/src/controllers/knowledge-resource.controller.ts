import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { workspaceIdParamSchema } from "../validator/workspace-validator";
import { uploadKnowledgeResourceSchema } from "../validator/knowledge-resource-validator";
import { UploadKnowledgeResourceUseCase } from "../application/use-cases/upload-knowledge-resource.use-case";
import { ResourceType } from "../domain/enums/resource-type";
import { createWorkspaceId, createUserId } from "../domain/primitives/brand";

function mimeTypeToResourceType(mimeType: string): ResourceType | null {
  if (mimeType === "application/pdf") return ResourceType.Pdf;
  if (mimeType === "text/markdown" || mimeType === "text/x-markdown")
    return ResourceType.Markdown;
  if (mimeType.startsWith("image/")) return ResourceType.Image;
  if (mimeType.startsWith("audio/")) return ResourceType.Audio;
  return null;
}

export function createKnowledgeResourceController(
  uploadUseCase: UploadKnowledgeResourceUseCase
) {
  return {
    upload: asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.id;
      const { workspaceId } = workspaceIdParamSchema.parse(req.params);
      const body = uploadKnowledgeResourceSchema.parse(req.body);
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "File is required" });
        return;
      }

      const type = mimeTypeToResourceType(file.mimetype);
      if (!type) {
        res.status(400).json({ error: "Unsupported file type" });
        return;
      }

      const resource = await uploadUseCase.execute({
        workspaceId: createWorkspaceId(workspaceId),
        userId: createUserId(userId),
        title: body.title ?? file.originalname,
        type,
        file: {
          buffer: file.buffer,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
      });

      res.status(202).json({ data: resource });
    }),
  };
}