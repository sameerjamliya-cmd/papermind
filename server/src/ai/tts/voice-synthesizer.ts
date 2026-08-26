import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

const TTS_URL = process.env.KOKORO_TTS_URL || "http://127.0.0.1:8001";
const TTS_API_KEY = process.env.KOKORO_TTS_API_KEY;

const VOICE_MAP = {
  host_a: { voice: "af_heart", speed: 1.05 },
  host_b: { voice: "am_michael", speed: 0.95 },
};

const BATCH_SIZE = 3;
const MAX_RETRIES = 2;

async function getMp3Duration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

async function getFfmpegPath(): Promise<string> {
  if (process.platform === "darwin") {
    try {
      const { stdout } = await execAsync("which ffmpeg");
      return stdout.trim();
    } catch {
      return "ffmpeg";
    }
  }
  try {
    const ffmpeg = require("@ffmpeg-installer/ffmpeg");
    return ffmpeg.path;
  } catch {
    return "ffmpeg";
  }
}

async function synthesizeSegment(
  text: string,
  voice: string,
  speed: number,
  index: number,
  dir: string
): Promise<{ filePath: string; duration: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const params = new URLSearchParams({
        text,
        voice,
        speed: String(speed),
      });
      const res = await fetch(`${TTS_URL}/tts?${params}`, {
        method: "POST",
        headers: TTS_API_KEY ? { "X-API-Key": TTS_API_KEY } : undefined,
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Kokoro TTS failed (${res.status}): ${body}`);
      }

      const wavBuffer = Buffer.from(await res.arrayBuffer());
      const wavPath = join(dir, `seg_${index}.wav`);
      const mp3Path = join(dir, `seg_${index}.mp3`);

      await writeFile(wavPath, wavBuffer);
      await execAsync(
        `ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -qscale:a 2 "${mp3Path}"`,
        { timeout: 15000 }
      );
      await unlink(wavPath).catch(() => {});

      const duration = await getMp3Duration(mp3Path);
      return { filePath: mp3Path, duration };
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error(`Failed to synthesize segment ${index}`);
}

export interface SynthesizedResult {
  segmentTimings: Array<{ startTime: number; endTime: number; duration: number }>;
  assembledFilePath: string;
  tempDir: string;
}

export async function synthesizeAndAssemble(
  segments: Array<{ speaker: "host_a" | "host_b"; text: string; topic: string }>,
  silenceMs = 500
): Promise<SynthesizedResult> {
  const dir = join(tmpdir(), `papermind-audio-${randomUUID()}`);
  const { mkdir } = await import("fs/promises");
  await mkdir(dir, { recursive: true });

  const results: Array<{ filePath: string; duration: number }> = [];
  const ffmpeg = await getFfmpegPath();

  try {
    for (let i = 0; i < segments.length; i += BATCH_SIZE) {
      const batch = segments.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((seg, bi) =>
          synthesizeSegment(
            seg.text,
            VOICE_MAP[seg.speaker].voice,
            VOICE_MAP[seg.speaker].speed,
            i + bi,
            dir
          )
        )
      );
      results.push(...batchResults);

      if (i + BATCH_SIZE < segments.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const files = results.map((r) => r.filePath);
    const durations = results.map((r) => r.duration);

    const concatFile = join(dir, `concat.txt`);
    const concatLines = files.map((f) => `file '${f}'`).join("\n");
    await writeFile(concatFile, concatLines);

    const outputFile = join(dir, `output.mp3`);
    await execAsync(
      `${ffmpeg} -f concat -safe 0 -i "${concatFile}" -c copy "${outputFile}" -y`,
      { timeout: 120000 }
    );

    const silenceSecs = silenceMs / 1000;
    const segmentTimings: Array<{
      startTime: number;
      endTime: number;
      duration: number;
    }> = [];
    let currentTime = 0;

    for (let i = 0; i < durations.length; i++) {
      const startTime = currentTime;
      const endTime = startTime + durations[i];
      segmentTimings.push({ startTime, endTime, duration: durations[i] });
      currentTime = endTime + silenceSecs;
    }

    for (const file of files) {
      unlink(file).catch(() => {});
    }
    unlink(concatFile).catch(() => {});

    return {
      segmentTimings,
      assembledFilePath: outputFile,
      tempDir: dir,
    };
  } catch (error) {
    for (const r of results) {
      unlink(r.filePath).catch(() => {});
    }
    throw error;
  }
}

export async function cleanupTempDir(dirPath: string): Promise<void> {
  const { rm } = await import("fs/promises");
  rm(dirPath, { recursive: true, force: true }).catch(() => {});
}
