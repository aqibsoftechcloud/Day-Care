import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, UploadInput } from "./types";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOADS_ROOT = "uploads";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  // SVG is only ever written here via `services/homepage-custom-icon.service.ts`,
  // and only ever with a buffer that has already been through
  // `lib/sanitize-svg.ts` — this provider has no opinion on SVG safety,
  // it just needs the right extension for the file it's asked to store.
  "image/svg+xml": ".svg",
};

/**
 * Stores files under public/uploads/<folder>/ so Next.js serves them
 * directly as static assets at /uploads/<folder>/<filename> — no custom
 * route needed. Filenames are always a random UUID plus an extension
 * derived from the (already-validated) MIME type; the original filename
 * is never used, so there is nothing to sanitize for path traversal.
 */
export class LocalStorageProvider implements StorageProvider {
  async upload(input: UploadInput, folder: string): Promise<string> {
    const extension = EXTENSION_BY_MIME_TYPE[input.mimeType];

    if (!extension) {
      throw new Error(`Unsupported mime type: ${input.mimeType}`);
    }

    const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");
    const filename = `${randomUUID()}${extension}`;
    const absoluteDir = path.join(PUBLIC_DIR, UPLOADS_ROOT, safeFolder);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(path.join(absoluteDir, filename), input.buffer);

    return `/${UPLOADS_ROOT}/${safeFolder}/${filename}`;
  }

  async delete(storedPath: string): Promise<void> {
    if (!storedPath.startsWith(`/${UPLOADS_ROOT}/`)) {
      return;
    }

    const absolutePath = path.join(PUBLIC_DIR, storedPath);

    try {
      await unlink(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
