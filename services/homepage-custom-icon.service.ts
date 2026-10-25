import sharp, { type Metadata } from "sharp";
import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/lib/storage";
import { sanitizeSvg, InvalidSvgError } from "@/lib/sanitize-svg";
import { HOMEPAGE_ICON_KEYS } from "@/types/homepage-icon-settings";

export { InvalidSvgError };

const HOMEPAGE_CUSTOM_ICON_UPLOAD_FOLDER = "homepage-icons";

export class HomepageCustomIconNotFoundError extends Error {
  constructor(id: number) {
    super(`Custom icon with id ${id} not found`);
    this.name = "HomepageCustomIconNotFoundError";
  }
}

/** Thrown by `deleteHomepageCustomIcon` when the asset is still referenced by at least one `homepage_icon_settings` row — the "do not delete a media asset that is still referenced" requirement. */
export class CustomIconInUseError extends Error {
  constructor(id: number, usedBy: string[]) {
    super(`Custom icon ${id} is still in use by: ${usedBy.join(", ")} — remove those references first.`);
    this.name = "CustomIconInUseError";
  }
}

export class InvalidRasterImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRasterImageError";
  }
}

const customIconSelect = {
  id: true,
  file_name: true,
  path: true,
  mime_type: true,
  width: true,
  height: true,
  file_size: true,
  created_at: true,
  updated_at: true,
} as const;

export async function listHomepageCustomIcons() {
  return prisma.homepage_custom_icons.findMany({
    select: customIconSelect,
    orderBy: { created_at: "desc" },
  });
}

/** Batch lookup for the public resolver (`lib/public/homepage-icons.ts`) — one query for every custom asset referenced across a resolved icon map, never N+1 per icon. */
export async function getHomepageCustomIconsByIds(ids: number[]) {
  if (ids.length === 0) return [];

  return prisma.homepage_custom_icons.findMany({
    where: { id: { in: ids } },
    select: customIconSelect,
  });
}

export async function getHomepageCustomIconById(id: number) {
  const row = await prisma.homepage_custom_icons.findUnique({ where: { id }, select: customIconSelect });

  if (!row) {
    throw new HomepageCustomIconNotFoundError(id);
  }

  return row;
}

/** Best-effort only — a hand-authored/exported SVG that omits both `width`/`height` and `viewBox` has no intrinsic size, and that's fine (the "where available" requirement). Never trusted for anything beyond admin-UI display; rendering always uses `object-contain` inside a fixed-size container regardless. */
function extractSvgDimensions(svg: string): { width: number | null; height: number | null } {
  const widthMatch = svg.match(/<svg[^>]*\swidth="(\d+(?:\.\d+)?)"/i);
  const heightMatch = svg.match(/<svg[^>]*\sheight="(\d+(?:\.\d+)?)"/i);
  if (widthMatch && heightMatch) {
    return { width: Math.round(Number(widthMatch[1])), height: Math.round(Number(heightMatch[1])) };
  }

  const viewBoxMatch = svg.match(/<svg[^>]*\sviewBox="[\d.\s-]*?\s([\d.]+)\s+([\d.]+)"/i);
  if (viewBoxMatch) {
    return { width: Math.round(Number(viewBoxMatch[1])), height: Math.round(Number(viewBoxMatch[2])) };
  }

  return { width: null, height: null };
}

export type CreateHomepageCustomIconInput = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
};

/**
 * Validates actual file CONTENT, never just the client-reported MIME
 * type/extension (multer's `fileFilter` already rejected anything
 * outside the allowlist by header, but a spoofed header could still
 * carry arbitrary bytes):
 * - SVG: decoded as UTF-8 text and run through `sanitizeSvg` — throws
 *   `InvalidSvgError` if it isn't parseable as a real `<svg>` document
 *   at all; the SANITIZED text (never the raw upload) is what's stored.
 * - Raster (PNG/WebP/JPEG): decoded with `sharp`, which throws on
 *   anything that isn't a genuinely valid image of that format —
 *   real content validation, not a header check.
 */
export async function createHomepageCustomIcon(input: CreateHomepageCustomIconInput) {
  const { buffer, mimeType, fileName } = input;

  if (mimeType === "image/svg+xml") {
    const raw = buffer.toString("utf-8");
    const { svg } = sanitizeSvg(raw); // throws InvalidSvgError for unparseable input
    const sanitizedBuffer = Buffer.from(svg, "utf-8");
    const { width, height } = extractSvgDimensions(svg);

    const path = await storageProvider.upload(
      { buffer: sanitizedBuffer, mimeType },
      HOMEPAGE_CUSTOM_ICON_UPLOAD_FOLDER
    );

    return prisma.homepage_custom_icons.create({
      data: {
        file_name: fileName,
        path,
        mime_type: mimeType,
        width,
        height,
        file_size: sanitizedBuffer.byteLength,
      },
      select: customIconSelect,
    });
  }

  let metadata: Metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new InvalidRasterImageError("The uploaded file is not a valid image.");
  }

  if (!metadata.width || !metadata.height) {
    throw new InvalidRasterImageError("Could not determine the uploaded image's dimensions.");
  }

  const MAX_DIMENSION = 2048;
  if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    throw new InvalidRasterImageError(`Image dimensions must not exceed ${MAX_DIMENSION}×${MAX_DIMENSION}px.`);
  }

  const path = await storageProvider.upload({ buffer, mimeType }, HOMEPAGE_CUSTOM_ICON_UPLOAD_FOLDER);

  return prisma.homepage_custom_icons.create({
    data: {
      file_name: fileName,
      path,
      mime_type: mimeType,
      width: metadata.width,
      height: metadata.height,
      file_size: buffer.byteLength,
    },
    select: customIconSelect,
  });
}

/** Scans every `homepage_icon_settings` row's `icons` JSON for a `{type: "custom", assetId: id}` reference — there's no FK from that Json column, so this is the application-level equivalent of `ON DELETE RESTRICT`. Returns a human-readable label per referencing row (its city name, or "Global Defaults"). */
async function findCustomIconReferences(assetId: number): Promise<string[]> {
  const rows = await prisma.homepage_icon_settings.findMany({
    select: { icons: true, city_id: true, cities: { select: { city_name: true } } },
  });

  const refs: string[] = [];
  for (const row of rows) {
    const icons = row.icons as Record<string, unknown> | null;
    if (!icons) continue;

    const isReferenced = HOMEPAGE_ICON_KEYS.some((key) => {
      const value = icons[key] as { type?: string; assetId?: number } | undefined;
      return value?.type === "custom" && value.assetId === assetId;
    });

    if (isReferenced) {
      refs.push(row.city_id === null ? "Global Defaults" : (row.cities?.city_name ?? `City #${row.city_id}`));
    }
  }

  return refs;
}

export async function deleteHomepageCustomIcon(id: number) {
  const current = await prisma.homepage_custom_icons.findUnique({ where: { id } });

  if (!current) {
    throw new HomepageCustomIconNotFoundError(id);
  }

  const references = await findCustomIconReferences(id);
  if (references.length > 0) {
    throw new CustomIconInUseError(id, references);
  }

  await prisma.homepage_custom_icons.delete({ where: { id } });
  await storageProvider.delete(current.path).catch((error) => {
    console.error("Failed to delete stored homepage custom icon file:", error);
  });
}
