import type { ResourceType } from "../../domain/enums/resource-type";

export interface UploadFileInput {
  readonly buffer: Buffer;
  readonly filename: string;
  readonly mimeType: string;
  readonly resourceType: ResourceType;
}

export interface UploadedFile {
  readonly url: string;
  readonly publicId: string;
}

export interface DeleteFileInput {
  readonly publicId: string;
  readonly resourceType?: ResourceType;
}

export interface FileStorage {
  upload(input: UploadFileInput): Promise<UploadedFile>;
  delete(input: DeleteFileInput): Promise<void>;
}