import multer from "multer";
import type { NextRequest } from "next/server";
import { Readable } from "node:stream";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * A deliberately separate, smaller allowlist/size-limit from the general
 * `ALLOWED_IMAGE_MIME_TYPES`/`upload` above — reused by every OTHER
 * image upload in this project (doctor photos, hospital images, global
 * treatment images, …), none of which accept SVG. Adding SVG support
 * there too (by widening the shared constant) would be a much larger
 * blast radius than this feature needs; homepage custom icons get their
 * own multer instance instead. 1MB instead of 5MB — an icon is a small
 * decorative asset, not a content photo.
 */
export const ALLOWED_ICON_MIME_TYPES = ["image/svg+xml", "image/png", "image/webp", "image/jpeg"] as const;
export const MAX_ICON_FILE_SIZE_BYTES = 1 * 1024 * 1024;

export class UnsupportedFileTypeError extends Error {
  constructor(mimeType: string) {
    super(`Unsupported file type: ${mimeType}`);
    this.name = "UnsupportedFileTypeError";
  }
}

export { MulterError } from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      callback(null, true);
      return;
    }

    callback(new UnsupportedFileTypeError(file.mimetype));
  },
});

const iconUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ICON_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_ICON_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_ICON_MIME_TYPES)[number])) {
      callback(null, true);
      return;
    }

    callback(new UnsupportedFileTypeError(file.mimetype));
  },
});

export type ParsedMultipartRequest = {
  fields: Record<string, string>;
  files: Record<string, Express.Multer.File[]>;
};

type MulterCompatibleRequest = NodeJS.ReadableStream & {
  headers: Record<string, string>;
  method?: string;
  url?: string;
  body?: Record<string, string>;
  files?: Record<string, Express.Multer.File[]>;
};

/**
 * Bridges a Next.js App Router `Request` into Multer, which only knows how
 * to work with a classic Express-style (req, res, next) signature. This is
 * the ONLY place that touches Multer directly: it receives and parses the
 * multipart body into memory (never touching the filesystem — storing and
 * deleting files is the storage provider's job, not Multer's).
 */
async function runMulter(
  request: NextRequest,
  middleware: ReturnType<multer.Multer["fields"]>
): Promise<ParsedMultipartRequest> {
  const buffer = Buffer.from(await request.arrayBuffer());

  const nodeRequest = Readable.from(buffer) as unknown as MulterCompatibleRequest;
  nodeRequest.headers = Object.fromEntries(request.headers.entries());
  nodeRequest.method = request.method;
  nodeRequest.url = request.url;

  return new Promise((resolve, reject) => {
    middleware(
      nodeRequest as unknown as Parameters<typeof middleware>[0],
      {} as Parameters<typeof middleware>[1],
      (error: unknown) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          fields: nodeRequest.body ?? {},
          files: nodeRequest.files ?? {},
        });
      }
    );
  });
}

export async function parseMultipartFields(
  request: NextRequest,
  fields: multer.Field[]
): Promise<ParsedMultipartRequest> {
  return runMulter(request, upload.fields(fields));
}

/** Same bridge, routed through the icon-specific multer instance (`ALLOWED_ICON_MIME_TYPES`/`MAX_ICON_FILE_SIZE_BYTES`) — see that constant's own doc comment for why this isn't just `parseMultipartFields` with a different fileFilter. */
export async function parseIconMultipartFields(
  request: NextRequest,
  fields: multer.Field[]
): Promise<ParsedMultipartRequest> {
  return runMulter(request, iconUpload.fields(fields));
}
