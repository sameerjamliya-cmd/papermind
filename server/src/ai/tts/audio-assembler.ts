import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

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

export interface AssembledAudio {
  buffer: Buffer;
  segmentTimings: Array<{ startTime: number; endTime: number; duration: number }>;
  totalDuration: number;
}

export async function combineAudioSegments(
  segments: Array<{ buffer: Buffer; duration: number }>,
  silenceMs = 300
): Promise<AssembledAudio> {
  if (segments.length === 0) {
    throw new Error("No audio segments to combine");
  }

  if (segments.length === 1) {
    return {
      buffer: segments[0].buffer,
      segmentTimings: [{ startTime: 0, endTime: segments[0].duration, duration: segments[0].duration }],
      totalDuration: segments[0].duration,
    };
  }

  const dir = tmpdir();
  const files: string[] = [];
  const ffmpeg = await getFfmpegPath();
  const silenceSecs = silenceMs / 1000;

  try {
    for (let i = 0; i < segments.length; i++) {
      const filePath = join(dir, `seg_${i}_${Date.now()}.mp3`);
      await writeFile(filePath, segments[i].buffer);
      files.push(filePath);
    }

    const concatFile = join(dir, `concat_${Date.now()}.txt`);
    const concatLines = files
      .map((f) => `file '${f.replace(/'/g, "'\\''")}'`)
      .join("\n");
    await writeFile(concatFile, concatLines);

    const outputFile = join(dir, `output_${Date.now()}.mp3`);

    await execAsync(
      `${ffmpeg} -f concat -safe 0 -i "${concatFile}" -c copy "${outputFile}" -y`,
      { timeout: 120000 }
    );

    const result = await readFile(outputFile);

    const segmentTimings: Array<{ startTime: number; endTime: number; duration: number }> = [];
    let currentTime = 0;
    for (const seg of segments) {
      const startTime = currentTime;
      const endTime = startTime + seg.duration;
      segmentTimings.push({ startTime, endTime, duration: seg.duration });
      currentTime = endTime + silenceSecs;
    }

    return { buffer: result, segmentTimings, totalDuration: currentTime - silenceSecs };
  } finally {
    for (const file of files) {
      unlink(file).catch(() => {});
    }
    const concatFile = join(dir, `concat_${Date.now()}.txt`);
    const outputFile = join(dir, `output_${Date.now()}.mp3`);
    unlink(concatFile).catch(() => {});
    unlink(outputFile).catch(() => {});
  }
}
