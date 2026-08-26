import { readFile } from "fs/promises";
import { inngest } from "../client";
import { audioOverviewRepository } from "../../repository/audio-overview.repository";
import { audioSegmentRepository } from "../../repository/audio-segment.repository";
import {
  generatePodcastScript,
  type PodcastScript,
} from "../../ai/tts/script-generator";
import { synthesizeAndAssemble, cleanupTempDir } from "../../ai/tts/voice-synthesizer";
import { uploadAudio } from "../../lib/cloudinary";

export const generateAudioOverview: ReturnType<
  typeof inngest.createFunction
> = inngest.createFunction(
  {
    id: "generate-audio-overview",
    name: "Generate Audio Overview",
    retries: 2,
    triggers: [{ event: "audio-overview.requested" }],
  },
  async ({ event, step }) => {
    const { audioOverviewId, workspaceId } = event.data as {
      audioOverviewId: string;
      workspaceId: string;
      userId: string;
    };

    const overview = await step.run("load-overview", () =>
      audioOverviewRepository.findById(audioOverviewId)
    );

    if (!overview) {
      throw new Error(`Audio overview ${audioOverviewId} not found`);
    }

    await step.run("mark-processing", () =>
      audioOverviewRepository.updateStatus(audioOverviewId, "processing")
    );

    try {
      const script = (await step.run("generate-script", async () => {
        const result = await generatePodcastScript(workspaceId);
        return result;
      })) as PodcastScript;

      const assembled = await step.run("synthesize-and-assemble", async () => {
        const result = await synthesizeAndAssemble(script.segments, 500);
        return result;
      });

      const uploadResult = await step.run("upload-audio", async () => {
        const audioBuffer = await readFile(assembled.assembledFilePath);
        const result = await uploadAudio(audioBuffer, `${audioOverviewId}.mp3`);
        return result;
      });

      await step.run("cleanup-temp", () => cleanupTempDir(assembled.tempDir));

      const segmentRecords = script.segments.map((seg, i) => ({
        order: i,
        speaker: seg.speaker,
        text: seg.text,
        topic: seg.topic,
        startTime: assembled.segmentTimings[i]?.startTime ?? 0,
        endTime: assembled.segmentTimings[i]?.endTime ?? 0,
        sourceRefs:
          seg.sources.length > 0
            ? seg.sources.map((s) => ({
                chunkId: s.chunkId,
                sourceId: s.sourceId,
                sourceTitle: s.sourceTitle,
                snippet: s.snippet,
              }))
            : undefined,
      }));

      await step.run("save-segments", () =>
        audioSegmentRepository.createMany(audioOverviewId, segmentRecords)
      );

      await step.run("mark-ready", () =>
        audioOverviewRepository.updateStatus(audioOverviewId, "ready", {
          audioUrl: uploadResult.url,
          duration: uploadResult.duration,
          estimatedDuration: script.estimatedDuration,
        })
      );

      return { audioUrl: uploadResult.url, duration: uploadResult.duration };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await step.run("mark-failed", () =>
        audioOverviewRepository.updateStatus(audioOverviewId, "failed", {
          errorMessage: message,
        })
      );
      throw error;
    }
  }
);
