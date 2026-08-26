import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { getEnv } from "../config/env";

let _configured = false;

function ensureConfig() {
  if (_configured) return;
  const env = getEnv();
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }
  _configured = true;
}

function uploadBuffer(
  buffer: Buffer,
  options: {
    resourceType: "raw" | "video";
    folder: string;
    filename: string;
    format?: string;
  }
): Promise<UploadApiResponse> {
  ensureConfig();
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary is not configured");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resourceType,
        folder: options.folder,
        public_id: `${Date.now()}-${options.filename}`,
        format: options.format,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadApiResponse);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function uploadPdf(
  buffer: Buffer,
  filename: string
): Promise<UploadApiResponse> {
  return uploadBuffer(buffer, {
    resourceType: "raw",
    folder: "papermind/sources",
    filename,
    format: "pdf",
  });
}

export async function uploadAudio(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; duration: number; publicId: string }> {
  const result = await uploadBuffer(buffer, {
    resourceType: "video",
    folder: "papermind/audio-overviews",
    filename,
  });
  return {
    url: result.secure_url,
    duration: result.duration ?? 0,
    publicId: result.public_id,
  };
}

export async function deletePdf(publicId: string): Promise<void> {
  ensureConfig();
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME) return;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: "raw" }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export async function deleteAudio(publicId: string): Promise<void> {
  ensureConfig();
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME) return;

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: "video" }, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export async function uploadTempAudioChunk(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; publicId: string; duration: number }> {
  const result = await uploadBuffer(buffer, {
    resourceType: "video",
    folder: "papermind/audio-overviews/temp",
    filename,
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration ?? 0,
  };
}

export async function deleteTempAudioChunks(publicIds: string[]): Promise<void> {
  ensureConfig();
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME) return;

  await Promise.all(
    publicIds.map((publicId) =>
      new Promise<void>((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, { resource_type: "video" }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      })
    )
  );
}
