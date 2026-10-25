import { prisma } from "@/lib/prisma";
import { sanitizeSectionPayload } from "@/lib/sanitize-html.server";
import { Prisma } from "@/app/generated/prisma/client";
import { storageProvider } from "@/lib/storage";
import type { UploadInput } from "@/lib/storage";
import { HospitalNotFoundError } from "@/services/hospital.service";
import {
  customSectionContentSchema,
  hospitalCtaSectionContentSchema,
  whyChooseUsSectionContentSchema,
} from "@/validators/hospital-section.validator";
import type {
  CreateHospitalSectionInput,
  HospitalSectionType,
  UpdateHospitalSectionInput,
} from "@/validators/hospital-section.validator";

export { HospitalNotFoundError };

const HOSPITAL_SECTION_UPLOAD_FOLDER = "hospital-sections";

/** Uploads one image for use inside a custom section's `content` JSON — mirrors `uploadTreatmentSectionImage`'s exact pattern, own independent storage folder. */
export async function uploadHospitalSectionImage(image: UploadInput): Promise<string> {
  return storageProvider.upload(image, HOSPITAL_SECTION_UPLOAD_FOLDER);
}

export class HospitalSectionNotFoundError extends Error {
  constructor(sectionId: number) {
    super(`Hospital section with id ${sectionId} not found`);
    this.name = "HospitalSectionNotFoundError";
  }
}

/** Thrown when `content` is sent for a section type with no configurable content, or when the content fails its own type's schema. */
export class InvalidSectionContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSectionContentError";
  }
}

/** Thrown if the API is ever asked to delete a fixed/system section — only `custom` rows are deletable. */
export class CannotDeleteFixedSectionError extends Error {
  constructor(sectionType: string) {
    super(`The "${sectionType}" section is a fixed section and cannot be deleted.`);
    this.name = "CannotDeleteFixedSectionError";
  }
}

const sectionSelect = {
  id: true,
  hospital_id: true,
  section_type: true,
  section_order: true,
  status: true,
  content: true,
  created_at: true,
  updated_at: true,
} as const;

/** Keyed by section_type — only the types with configurable content. Fixed types with no schema here (hero/overview/disclaimer) read straight from `hospitals` or fixed interface copy, and reject any `content` write attempt. */
const SECTION_CONTENT_SCHEMAS = {
  why_choose_us: whyChooseUsSectionContentSchema,
  cta: hospitalCtaSectionContentSchema,
  custom: customSectionContentSchema,
} as const;

/**
 * Default order matches the locked Hospital Detail Page structure: Hero,
 * Overview (About), Why Choose Us, CTA (Consult the Doctor Now),
 * Disclaimer. All default to `active`: `why_choose_us`/`cta` self-hide
 * publicly while their own content is empty (a brand-new backfilled row
 * starts with `content: null`), so defaulting to `active` never shows
 * fabricated content — it just means "don't hide this once an admin
 * fills it in."
 */
const FIXED_SECTION_TYPES: HospitalSectionType[] = ["hero", "overview", "why_choose_us", "cta", "disclaimer"];

async function ensureHospitalExists(hospitalId: number) {
  const hospital = await prisma.hospitals.findUnique({ where: { id: hospitalId } });

  if (!hospital) {
    throw new HospitalNotFoundError(hospitalId);
  }
}

async function getNextSectionOrder(hospitalId: number): Promise<number> {
  const last = await prisma.hospital_sections.findFirst({
    where: { hospital_id: hospitalId },
    orderBy: { section_order: "desc" },
    select: { section_order: true },
  });

  return (last?.section_order ?? -1) + 1;
}

/**
 * Ensures each of the 5 fixed section types has exactly one row for this
 * hospital, then returns every row (fixed + custom) in order — the one
 * function both the admin UI and the public renderer call. Mirrors
 * `getOrCreateTreatmentSections()`'s exact backfill-order-collision
 * safety: a brand-new hospital gets every fixed type at its
 * `FIXED_SECTION_TYPES.indexOf()` position; a hospital that already has
 * SOME rows gets any still-missing types appended after the current max
 * order instead.
 */
export async function getOrCreateHospitalSections(hospitalId: number) {
  await ensureHospitalExists(hospitalId);

  const existing = await prisma.hospital_sections.findMany({
    where: { hospital_id: hospitalId, section_type: { in: FIXED_SECTION_TYPES } },
    select: { section_type: true },
  });
  const existingTypes = new Set(existing.map((row) => row.section_type));
  const missingTypes = FIXED_SECTION_TYPES.filter((type) => !existingTypes.has(type));

  if (missingTypes.length > 0) {
    const isBrandNewHospital = existingTypes.size === 0;
    const nextOrder = isBrandNewHospital ? 0 : await getNextSectionOrder(hospitalId);

    await prisma.hospital_sections.createMany({
      data: missingTypes.map((section_type, index) => ({
        hospital_id: hospitalId,
        section_type,
        section_order: isBrandNewHospital ? FIXED_SECTION_TYPES.indexOf(section_type) : nextOrder + index,
        status: "active" as const,
      })),
    });
  }

  return prisma.hospital_sections.findMany({
    where: { hospital_id: hospitalId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}

export async function getHospitalSectionById(hospitalId: number, sectionId: number) {
  const section = await prisma.hospital_sections.findFirst({
    where: { id: sectionId, hospital_id: hospitalId },
    select: sectionSelect,
  });

  if (!section) {
    throw new HospitalSectionNotFoundError(sectionId);
  }

  return section;
}

/** Always creates a `section_type: "custom"` row — the only section-creation endpoint, structurally cannot create a fixed type. Appended at the end of the current order by default. */
export async function createHospitalSection(hospitalId: number, input: CreateHospitalSectionInput) {
  const data = sanitizeSectionPayload(input);
  await ensureHospitalExists(hospitalId);

  const order = await getNextSectionOrder(hospitalId);

  return prisma.hospital_sections.create({
    data: {
      hospital_id: hospitalId,
      section_type: "custom",
      section_order: order,
      status: data.status ?? "active",
      content: data.content as Prisma.InputJsonValue,
    },
    select: sectionSelect,
  });
}

export async function updateHospitalSection(hospitalId: number, sectionId: number, input: UpdateHospitalSectionInput) {
  const data = sanitizeSectionPayload(input);
  // Ensures the fixed set exists first — covers a hospital whose sections have never been read (by admin or public) before this call.
  await getOrCreateHospitalSections(hospitalId);

  const current = await getHospitalSectionById(hospitalId, sectionId);

  let content: Prisma.InputJsonValue | undefined;

  if (data.content !== undefined) {
    const schema = SECTION_CONTENT_SCHEMAS[current.section_type as keyof typeof SECTION_CONTENT_SCHEMAS];

    if (!schema) {
      throw new InvalidSectionContentError(`The "${current.section_type}" section has no configurable content.`);
    }

    const parsed = schema.safeParse(data.content);

    if (!parsed.success) {
      throw new InvalidSectionContentError(parsed.error.issues.map((issue) => issue.message).join(", "));
    }

    content = parsed.data as Prisma.InputJsonValue;
  }

  return prisma.hospital_sections.update({
    where: { id: sectionId },
    data: {
      ...(data.section_order !== undefined ? { section_order: data.section_order } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(content !== undefined ? { content } : {}),
      updated_at: new Date(),
    },
    select: sectionSelect,
  });
}

/** Hard delete — a custom section is a lightweight child row with no independent reporting/audit significance. Refuses to delete a fixed/system section. */
export async function deleteHospitalSection(hospitalId: number, sectionId: number) {
  const current = await getHospitalSectionById(hospitalId, sectionId);

  if (current.section_type !== "custom") {
    throw new CannotDeleteFixedSectionError(current.section_type);
  }

  await prisma.hospital_sections.delete({ where: { id: sectionId } });
}

/** Bulk-persists a new `section_order` per section id, all in one transaction — id-based so it works for fixed AND custom rows alike. */
export async function reorderHospitalSections(hospitalId: number, order: { id: number; section_order: number }[]) {
  await getOrCreateHospitalSections(hospitalId);

  const ids = order.map((entry) => entry.id);
  const existing = await prisma.hospital_sections.findMany({
    where: { id: { in: ids }, hospital_id: hospitalId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((section) => section.id));
  const missingId = ids.find((id) => !existingIds.has(id));

  if (missingId !== undefined) {
    throw new HospitalSectionNotFoundError(missingId);
  }

  await prisma.$transaction(
    order.map((entry) =>
      prisma.hospital_sections.update({
        where: { id: entry.id },
        data: { section_order: entry.section_order, updated_at: new Date() },
      })
    )
  );

  return prisma.hospital_sections.findMany({
    where: { hospital_id: hospitalId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}
