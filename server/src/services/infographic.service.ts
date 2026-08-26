import { createHash, randomUUID } from "node:crypto";
import { NotFoundError, ForbiddenError } from "../types/app-error";
import { infographicRepository } from "../repository/infographic.repository";
import { workspaceRepository } from "../repository/workspace.repository";
import { sourceRepository } from "../repository/source.repository";
import { inngest } from "../inngest/client";
import {
  getStyleMeta,
  PLANNER_VERSION,
  RENDERER_VERSION,
} from "../ai/infographic/styles";
import { getLanguageMeta } from "../ai/infographic/languages";
import type {
  InfographicConfig,
  InfographicStyleId,
  InfographicLanguage,
} from "../types";

async function getOwnedWorkspace(workspaceId: string, userId: string) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found");
  if (workspace.userId !== userId) throw new ForbiddenError();
  return workspace;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

async function computeSourceVersion(workspaceId: string): Promise<string> {
  const { sources } = await sourceRepository.findAllByWorkspace(workspaceId, {
    page: 1,
    limit: 1000,
  });
  const fingerprint = sources
    .map((s) => `${s.id}:${s.chunkCount ?? 0}:${s.updatedAt.getTime()}`)
    .sort()
    .join("|");
  return sha256(fingerprint);
}

function buildCacheKey(params: {
  sourceVersion: string;
  prompt: string;
  styleId: InfographicStyleId;
  language: InfographicLanguage;
}): string {
  return sha256(
    [
      params.sourceVersion,
      params.prompt,
      params.styleId,
      params.language,
      String(PLANNER_VERSION),
      String(RENDERER_VERSION),
    ].join("::")
  );
}

export const infographicService = {
  async requestInfographic(
    workspaceId: string,
    userId: string,
    input: {
      styleId: InfographicStyleId;
      language: InfographicLanguage;
      prompt?: string;
      regenerate?: boolean;
    }
  ) {
    await getOwnedWorkspace(workspaceId, userId);

    // Validate style + language up-front so invalid values never reach the job.
    getStyleMeta(input.styleId);
    getLanguageMeta(input.language);

    const prompt = input.prompt?.trim() ?? "";
    const sourceVersion = await computeSourceVersion(workspaceId);
    // Regenerating must always produce a fresh row, so salt the key.
    const cacheKey =
      (input.regenerate ? `${randomUUID()}::` : "") +
      buildCacheKey({
        sourceVersion,
        prompt,
        styleId: input.styleId,
        language: input.language,
      });

    const config: InfographicConfig = {
      styleId: input.styleId,
      language: input.language,
      prompt,
    };

    // Cache: reuse an existing row for the same key when it's still valid.
    const existing = await infographicRepository.findByCacheKey(
      workspaceId,
      cacheKey
    );
    if (existing) {
      if (existing.status === "ready" || existing.status === "generating" || existing.status === "processing") {
        return existing;
      }
      // Failed previously — reset and retry generation for this key.
      await infographicRepository.updateStatus(existing.id, "generating");
      await inngest.send({
        name: "infographic.requested",
        data: { infographicId: existing.id, workspaceId, userId, config },
      });
      return infographicRepository.findById(existing.id);
    }

    const infographic = await infographicRepository.create({
      workspaceId,
      userId,
      config,
      language: input.language,
      cacheKey,
      plannerVersion: PLANNER_VERSION,
      rendererVersion: RENDERER_VERSION,
    });

    await inngest.send({
      name: "infographic.requested",
      data: {
        infographicId: infographic.id,
        workspaceId,
        userId,
        config,
      },
    });

    return infographic;
  },

  async getInfographic(id: string, workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    const infographic = await infographicRepository.findById(id);
    if (!infographic) throw new NotFoundError("Infographic not found");
    if (infographic.workspaceId !== workspaceId || infographic.userId !== userId) {
      throw new ForbiddenError();
    }
    return infographic;
  },

  async listInfographics(workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    return infographicRepository.findByWorkspace(workspaceId);
  },

  async deleteInfographic(id: string, workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    const infographic = await infographicRepository.findById(id);
    if (!infographic) throw new NotFoundError("Infographic not found");
    if (infographic.workspaceId !== workspaceId || infographic.userId !== userId) {
      throw new ForbiddenError();
    }
    await infographicRepository.delete(id);
  },
};