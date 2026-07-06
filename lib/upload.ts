import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UploadValidationError extends Error {}

/**
 * Validates and persists an uploaded image to a date-partitioned folder
 * under public/uploads, behind this single function so the storage backend
 * (local disk today) can be swapped later without touching call sites.
 */
export async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new UploadValidationError("Chi cho phep file anh (jpg, png, webp, gif)");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new UploadValidationError("File anh qua lon (toi da 8MB)");
  }

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const dir = path.join(process.cwd(), "public", "uploads", yyyy, mm);
  await mkdir(dir, { recursive: true });

  const ext = EXT_BY_MIME[file.type] || "bin";
  const filename = `${randomUUID()}.${ext}`;
  const filePath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/${yyyy}/${mm}/${filename}`;
}
