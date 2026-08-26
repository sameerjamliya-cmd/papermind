import { NotFoundError, ForbiddenError } from "../types/app-error";
import { audioOverviewRepository } from "../repository/audio-overview.repository";
import { workspaceRepository } from "../repository/workspace.repository";
import { inngest } from "../inngest/client";
import { deleteAudio } from "../lib/cloudinary";

async function getOwnedWorkspace(workspaceId: string, userId: string) {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError("Workspace not found");
  if (workspace.userId !== userId) throw new ForbiddenError();
  return workspace;
}

async function getOwnedOverview(overviewId: string) {
  const overview = await audioOverviewRepository.findById(overviewId);
  if (!overview) throw new NotFoundError("Audio overview not found");
  return overview;
}

export const audioOverviewService = {
  async requestOverview(
    workspaceId: string,
    userId: string,
    title?: string
  ) {
    console.log("[audio-overview] request received", { workspaceId, userId });

    let workspace;
    try {
      workspace = await getOwnedWorkspace(workspaceId, userId);
      console.log("[audio-overview] workspace verified", workspace.title);
    } catch (err) {
      console.log("[audio-overview] workspace check FAILED", (err as Error).message);
      throw err;
    }

    const existing = await audioOverviewRepository.findActiveByWorkspace(workspaceId);
    if (existing) {
      console.log("[audio-overview] found active record", existing.id, existing.status, existing.createdAt);
      const ageMinutes = (Date.now() - new Date(existing.createdAt).getTime()) / 60000;
      if (ageMinutes < 15) {
        console.log("[audio-overview] BLOCKED — active record too recent", { ageMinutes });
        throw new Error("An audio overview is already being generated for this workspace");
      }
      console.log("[audio-overview] stale record — auto-failing", existing.id);
      await audioOverviewRepository.updateStatus(existing.id, "failed", {
        errorMessage: "Timed out — generation took too long",
      });
    }

    let overview;
    try {
      overview = await audioOverviewRepository.create({
        workspaceId,
        userId,
        title: title || `${workspace.title} — Audio Overview`,
      });
      console.log("[audio-overview] DB record created", overview.id);
    } catch (err) {
      console.log("[audio-overview] DB create FAILED", (err as Error).message);
      throw err;
    }

    try {
      const result = await inngest.send({
        name: "audio-overview.requested",
        data: {
          audioOverviewId: overview.id,
          workspaceId,
          userId,
        },
      });
      console.log("[audio-overview] Inngest event sent", {
        overviewId: overview.id,
        eventIds: result?.ids,
      });
    } catch (err) {
      console.log("[audio-overview] Inngest send FAILED", (err as Error).message);
      throw err;
    }

    return overview;
  },

  async listOverviews(workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    return audioOverviewRepository.findAllByWorkspace(workspaceId);
  },

  async getOverview(overviewId: string, workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    return getOwnedOverview(overviewId);
  },

  async deleteOverview(overviewId: string, workspaceId: string, userId: string) {
    await getOwnedWorkspace(workspaceId, userId);
    const overview = await getOwnedOverview(overviewId);

    if (overview.audioUrl) {
      const urlParts = overview.audioUrl.split("/");
      const filename = urlParts[urlParts.length - 1].split(".")[0];
      const publicId = `papermind/audio-overviews/${filename}`;
      await deleteAudio(publicId).catch(() => {});
    }

    return audioOverviewRepository.delete(overviewId);
  },
};
