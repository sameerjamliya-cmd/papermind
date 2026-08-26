import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "../../config/env";
import type {
  DeleteFileInput,
  FileStorage,
  UploadFileInput,
  UploadedFile,
} from "../../application/ports/file-storage";
import { ResourceType } from "../../domain/enums/resource-type";

let _configured = false;

function ensureConfig(): void {
  if (_configured) return;
  const env = getEnv();
  if (
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }
  _configured = true;
}

function toCloudinaryResourceType(
  type: ResourceType
): "raw" | "image" | "video" {
  switch (type) {
    case ResourceType.Image:
      return "image";
    case ResourceType.Audio:
      return "video";
    default:
      return "raw";
  }
}

export class CloudinaryFileStorage implements FileStorage {
  async upload(input: UploadFileInput): Promise<UploadedFile> {
    ensureConfig();
    const env = getEnv();
    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw new Error("Cloudinary is not configured");
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: toCloudinaryResourceType(input.resourceType),
          folder: "papermind/resources",
          public_id: `${Date.now()}-${input.filename}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error("Cloudinary upload returned no result"));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );
      uploadStream.end(input.buffer);
    });
  }

  async delete(input: DeleteFileInput): Promise<void> {
    ensureConfig();
    const env = getEnv();
    if (!env.CLOUDINARY_CLOUD_NAME) return;

    const resourceType = input.resourceType
      ? toCloudinaryResourceType(input.resourceType)
      : "raw";

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        input.publicId,
        { resource_type: resourceType },
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  }
}