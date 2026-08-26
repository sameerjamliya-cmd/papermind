import { Innertube } from "youtubei.js/web";
import { YoutubeTranscript } from "youtube-transcript";
import { transcribeAudio } from "../orchestrator/openai";

async function getVideoId(url: string): Promise<string> {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  throw new Error("Invalid YouTube URL");
}

async function getCaptionsFromTranscript(videoId: string): Promise<string | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (transcript && transcript.length > 0) {
      return transcript.map((seg) => seg.text).join(" ");
    }
  } catch {
    // no captions from youtube-transcript
  }
  return null;
}

async function getCaptionsFromYoutubeiJs(videoId: string): Promise<string | null> {
  try {
    const yt = await Innertube.create({ lang: "en", location: "US" });
    const info = await yt.getInfo(videoId);

    if (info.captions?.caption_tracks?.length) {
      const transcriptInfo = await info.getTranscript();
      const segments =
        transcriptInfo.transcript.content?.body?.initial_segments;

      if (segments && segments.length > 0) {
        return segments
          .map((seg) => {
            if ("snippet" in seg && seg.snippet) {
              return String(seg.snippet);
            }
            return "";
          })
          .filter(Boolean)
          .join(" ");
      }
    }
  } catch {
    // no captions from youtubei.js
  }
  return null;
}

async function downloadAudioWithWhisper(videoId: string): Promise<string> {
  const yt = await Innertube.create({ lang: "en", location: "US" });
  const stream = await yt.download(videoId, {
    type: "audio",
    quality: "bestefficiency",
  });

  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const audioBuffer = Buffer.concat(
    chunks.map((c) => Buffer.from(c)),
    totalLength
  );

  return transcribeAudio(audioBuffer, `youtube-${videoId}.webm`);
}

export async function extractYoutubeContent(url: string): Promise<string> {
  const videoId = await getVideoId(url);

  const text = await getCaptionsFromTranscript(videoId);
  if (text) return text;

  const ytText = await getCaptionsFromYoutubeiJs(videoId);
  if (ytText) return ytText;

  try {
    return await downloadAudioWithWhisper(videoId);
  } catch {
    throw new Error(
      "No captions available and audio download failed. This video may not have subtitles enabled."
    );
  }
}