import { prisma } from "@/lib/prisma";
import { sanitizeSectionPayload } from "@/lib/sanitize-html.server";
import { Prisma } from "@/app/generated/prisma/client";
import { storageProvider } from "@/lib/storage";
import type { UploadInput } from "@/lib/storage";
import { PageNotFoundError } from "@/services/page.service";
import { SECTION_CONTENT_SCHEMAS } from "@/validators/page-section.validator";
import type {
  CreatePageSectionInput,
  PageSectionType,
  UpdatePageSectionInput,
} from "@/validators/page-section.validator";

export { PageNotFoundError };

const PAGE_SECTION_UPLOAD_FOLDER = "page-sections";

/**
 * Uploads one image for use inside a section's `content` JSON and returns
 * the stored path — the same `storageProvider` every other module's image
 * upload already goes through, just exposed as its own small endpoint
 * (see controllers/page-section.controller.ts) instead of being bundled
 * into a single-entity multipart request like Testimonials/Doctors. That
 * per-entity shape doesn't fit here: a Features section can hold a
 * variable number of items, each with its own optional image, so the
 * client uploads each image independently (getting back a path) and
 * includes that path string in the JSON it saves — not a second upload
 * system, the same primitives, just decoupled from a fixed set of named
 * multipart fields.
 */
export async function uploadPageSectionImage(image: UploadInput): Promise<string> {
  return storageProvider.upload(image, PAGE_SECTION_UPLOAD_FOLDER);
}

export class PageSectionNotFoundError extends Error {
  constructor(id: number) {
    super(`Page section with id ${id} not found`);
    this.name = "PageSectionNotFoundError";
  }
}

/** Thrown when an update's `content` doesn't match the section's own (immutable) `section_type` shape. */
export class InvalidSectionContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSectionContentError";
  }
}

const pageSectionSelect = {
  id: true,
  page_id: true,
  section_type: true,
  section_order: true,
  status: true,
  content: true,
  created_at: true,
  updated_at: true,
} as const;

async function ensurePageExists(pageId: number) {
  const page = await prisma.pages.findUnique({ where: { id: pageId } });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }
}

/** Every existing section on the page, ordered the same way the public renderer reads them — callers needing "the next free slot" reuse this instead of a second query. */
async function getNextSectionOrder(pageId: number): Promise<number> {
  const last = await prisma.page_sections.findFirst({
    where: { page_id: pageId },
    orderBy: { section_order: "desc" },
    select: { section_order: true },
  });

  return (last?.section_order ?? -1) + 1;
}

export async function getPageSections(pageId: number) {
  await ensurePageExists(pageId);

  return prisma.page_sections.findMany({
    where: { page_id: pageId },
    select: pageSectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}

export async function getPageSectionById(pageId: number, sectionId: number) {
  const section = await prisma.page_sections.findFirst({
    where: { id: sectionId, page_id: pageId },
    select: pageSectionSelect,
  });

  if (!section) {
    throw new PageSectionNotFoundError(sectionId);
  }

  return section;
}

export async function createPageSection(pageId: number, input: CreatePageSectionInput) {
  const data = sanitizeSectionPayload(input);
  await ensurePageExists(pageId);

  const order = data.section_order ?? (await getNextSectionOrder(pageId));

  return prisma.page_sections.create({
    data: {
      page_id: pageId,
      section_type: data.section_type,
      section_order: order,
      status: data.status ?? "active",
      content: data.content as Prisma.InputJsonValue,
    },
    select: pageSectionSelect,
  });
}

export async function updatePageSection(pageId: number, sectionId: number, input: UpdatePageSectionInput) {
  const data = sanitizeSectionPayload(input);
  const current = await getPageSectionById(pageId, sectionId);

  let content: Prisma.InputJsonValue | undefined;

  if (data.content !== undefined) {
    const schema = SECTION_CONTENT_SCHEMAS[current.section_type as PageSectionType];
    const parsed = schema.safeParse(data.content);

    if (!parsed.success) {
      throw new InvalidSectionContentError(parsed.error.issues.map((issue) => issue.message).join(", "));
    }

    content = parsed.data as Prisma.InputJsonValue;
  }

  return prisma.page_sections.update({
    where: { id: sectionId },
    data: {
      ...(data.section_order !== undefined ? { section_order: data.section_order } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(content !== undefined ? { content } : {}),
      updated_at: new Date(),
    },
    select: pageSectionSelect,
  });
}

/** Appends a copy of an existing section at the end of the page's section list — same `content`/`status`, a fresh `id`. */
export async function duplicatePageSection(pageId: number, sectionId: number) {
  const current = await getPageSectionById(pageId, sectionId);
  const order = await getNextSectionOrder(pageId);

  return prisma.page_sections.create({
    data: {
      page_id: pageId,
      section_type: current.section_type,
      section_order: order,
      status: current.status,
      content: current.content as Prisma.InputJsonValue,
    },
    select: pageSectionSelect,
  });
}

/**
 * Hard delete — unlike `pages` itself (soft-deleted via `status`),
 * a section is a lightweight child row of one page with no independent
 * reporting/audit significance, so removing it for real (matching the
 * CMS UX's literal "Delete section" action) is appropriate here.
 */
export async function deletePageSection(pageId: number, sectionId: number) {
  await getPageSectionById(pageId, sectionId);
  await prisma.page_sections.delete({ where: { id: sectionId } });
}

/** Bulk-persists a new `section_order` per section id, all in one transaction. Every id must already belong to `pageId` — a stray/foreign id fails the whole reorder rather than partially applying it. */
export async function reorderPageSections(pageId: number, order: { id: number; section_order: number }[]) {
  await ensurePageExists(pageId);

  const ids = order.map((entry) => entry.id);
  const existing = await prisma.page_sections.findMany({
    where: { id: { in: ids }, page_id: pageId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((section) => section.id));
  const missingId = ids.find((id) => !existingIds.has(id));

  if (missingId !== undefined) {
    throw new PageSectionNotFoundError(missingId);
  }

  await prisma.$transaction(
    order.map((entry) =>
      prisma.page_sections.update({
        where: { id: entry.id },
        data: { section_order: entry.section_order, updated_at: new Date() },
      })
    )
  );

  return getPageSections(pageId);
}
