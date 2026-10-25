import { prisma } from "@/lib/prisma";
import { sanitizeSectionPayload } from "@/lib/sanitize-html.server";
import { Prisma } from "@/app/generated/prisma/client";
import { storageProvider } from "@/lib/storage";
import type { UploadInput } from "@/lib/storage";
import { TreatmentNotFoundError } from "@/services/treatment.service";
import {
  ctaSectionContentSchema,
  customSectionContentSchema,
  eligibilitySectionContentSchema,
  factsSectionContentSchema,
  highlightsSectionContentSchema,
  journeySectionContentSchema,
  optionsSectionContentSchema,
  preparationRecoverySectionContentSchema,
  processSectionContentSchema,
  whyChooseUsSectionContentSchema,
} from "@/validators/treatment-section.validator";
import type {
  CreateTreatmentSectionInput,
  TreatmentSectionType,
  UpdateTreatmentSectionInput,
} from "@/validators/treatment-section.validator";

export { TreatmentNotFoundError };

const TREATMENT_SECTION_UPLOAD_FOLDER = "treatment-sections";

/** Uploads one image for use inside a custom section's `content` JSON — mirrors `uploadSpecialitySectionImage`'s exact pattern, own independent storage folder. */
export async function uploadTreatmentSectionImage(image: UploadInput): Promise<string> {
  return storageProvider.upload(image, TREATMENT_SECTION_UPLOAD_FOLDER);
}

export class TreatmentSectionNotFoundError extends Error {
  constructor(sectionId: number) {
    super(`Treatment section with id ${sectionId} not found`);
    this.name = "TreatmentSectionNotFoundError";
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
  treatment_id: true,
  section_type: true,
  section_order: true,
  status: true,
  content: true,
  created_at: true,
  updated_at: true,
} as const;

/** Keyed by section_type — every type with any configurable content. Fixed types with no schema here (hero/overview/symptoms/doctors/hospital/faqs) read straight from `treatments`/its relations and reject any `content` write attempt. */
const SECTION_CONTENT_SCHEMAS = {
  highlights: highlightsSectionContentSchema,
  facts: factsSectionContentSchema,
  options: optionsSectionContentSchema,
  eligibility: eligibilitySectionContentSchema,
  why_choose_us: whyChooseUsSectionContentSchema,
  process: processSectionContentSchema,
  journey: journeySectionContentSchema,
  preparation_recovery: preparationRecoverySectionContentSchema,
  cta: ctaSectionContentSchema,
  custom: customSectionContentSchema,
} as const;

/**
 * Default order matches the locked Treatment Detail Page structure:
 * Hero, Highlights, Overview, Facts, Symptoms, Options, Eligibility,
 * Why Choose Us, Doctors, Process, Journey, Hospital,
 * Preparation/Recovery, FAQs, CTA. All 15 default to `active`: every one
 * already rendered on the approved locked UI — the structured/content
 * ones (highlights/facts/options/eligibility/why_choose_us/process/
 * journey/preparation_recovery) self-hide publicly while their own
 * content is empty (a brand-new backfilled row starts with
 * `content: null`), so defaulting to `active` never shows fabricated
 * content, it just means "don't hide this once an admin fills it in."
 */
const FIXED_SECTION_TYPES: TreatmentSectionType[] = [
  "hero",
  "highlights",
  "overview",
  "facts",
  "symptoms",
  "options",
  "eligibility",
  "why_choose_us",
  "doctors",
  "process",
  "journey",
  "hospital",
  "preparation_recovery",
  "faqs",
  "cta",
];

async function ensureTreatmentExists(treatmentId: number) {
  const treatment = await prisma.treatments.findUnique({ where: { id: treatmentId } });

  if (!treatment) {
    throw new TreatmentNotFoundError(treatmentId);
  }
}

/** Every existing section on the treatment, ordered the same way the public renderer reads them. */
async function getNextSectionOrder(treatmentId: number): Promise<number> {
  const last = await prisma.treatment_sections.findFirst({
    where: { treatment_id: treatmentId },
    orderBy: { section_order: "desc" },
    select: { section_order: true },
  });

  return (last?.section_order ?? -1) + 1;
}

/**
 * Ensures each of the 15 fixed section types has exactly one row for this
 * treatment, then returns every row (fixed + custom) in order — the one
 * function both the admin UI and the public renderer call. Mirrors
 * `getOrCreateSpecialitySections()`'s exact backfill-order-collision
 * safety (see that function's own doc comment): a brand-new treatment
 * gets every fixed type at its `FIXED_SECTION_TYPES.indexOf()` position;
 * a treatment that already has SOME rows gets any still-missing types
 * appended after the current max order instead, so a later-added fixed
 * type never collides with an existing row's position.
 */
export async function getOrCreateTreatmentSections(treatmentId: number) {
  await ensureTreatmentExists(treatmentId);

  const existing = await prisma.treatment_sections.findMany({
    where: { treatment_id: treatmentId, section_type: { in: FIXED_SECTION_TYPES } },
    select: { section_type: true },
  });
  const existingTypes = new Set(existing.map((row) => row.section_type));
  const missingTypes = FIXED_SECTION_TYPES.filter((type) => !existingTypes.has(type));

  if (missingTypes.length > 0) {
    const isBrandNewTreatment = existingTypes.size === 0;
    const nextOrder = isBrandNewTreatment ? 0 : await getNextSectionOrder(treatmentId);

    await prisma.treatment_sections.createMany({
      data: missingTypes.map((section_type, index) => ({
        treatment_id: treatmentId,
        section_type,
        section_order: isBrandNewTreatment ? FIXED_SECTION_TYPES.indexOf(section_type) : nextOrder + index,
        status: "active" as const,
      })),
    });
  }

  return prisma.treatment_sections.findMany({
    where: { treatment_id: treatmentId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}

export async function getTreatmentSectionById(treatmentId: number, sectionId: number) {
  const section = await prisma.treatment_sections.findFirst({
    where: { id: sectionId, treatment_id: treatmentId },
    select: sectionSelect,
  });

  if (!section) {
    throw new TreatmentSectionNotFoundError(sectionId);
  }

  return section;
}

/** Always creates a `section_type: "custom"` row — the only section-creation endpoint, structurally cannot create a fixed type. Appended at the end of the current order by default. */
export async function createTreatmentSection(treatmentId: number, input: CreateTreatmentSectionInput) {
  const data = sanitizeSectionPayload(input);
  await ensureTreatmentExists(treatmentId);

  const order = await getNextSectionOrder(treatmentId);

  return prisma.treatment_sections.create({
    data: {
      treatment_id: treatmentId,
      section_type: "custom",
      section_order: order,
      status: data.status ?? "active",
      content: data.content as Prisma.InputJsonValue,
    },
    select: sectionSelect,
  });
}

export async function updateTreatmentSection(treatmentId: number, sectionId: number, input: UpdateTreatmentSectionInput) {
  const data = sanitizeSectionPayload(input);
  // Ensures the fixed set exists first — covers a treatment whose sections have never been read (by admin or public) before this call.
  await getOrCreateTreatmentSections(treatmentId);

  const current = await getTreatmentSectionById(treatmentId, sectionId);

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

  return prisma.treatment_sections.update({
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
export async function deleteTreatmentSection(treatmentId: number, sectionId: number) {
  const current = await getTreatmentSectionById(treatmentId, sectionId);

  if (current.section_type !== "custom") {
    throw new CannotDeleteFixedSectionError(current.section_type);
  }

  await prisma.treatment_sections.delete({ where: { id: sectionId } });
}

/** Bulk-persists a new `section_order` per section id, all in one transaction — id-based so it works for fixed AND custom rows alike. */
export async function reorderTreatmentSections(treatmentId: number, order: { id: number; section_order: number }[]) {
  await getOrCreateTreatmentSections(treatmentId);

  const ids = order.map((entry) => entry.id);
  const existing = await prisma.treatment_sections.findMany({
    where: { id: { in: ids }, treatment_id: treatmentId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((section) => section.id));
  const missingId = ids.find((id) => !existingIds.has(id));

  if (missingId !== undefined) {
    throw new TreatmentSectionNotFoundError(missingId);
  }

  await prisma.$transaction(
    order.map((entry) =>
      prisma.treatment_sections.update({
        where: { id: entry.id },
        data: { section_order: entry.section_order, updated_at: new Date() },
      })
    )
  );

  return prisma.treatment_sections.findMany({
    where: { treatment_id: treatmentId },
    select: sectionSelect,
    orderBy: [{ section_order: "asc" }, { id: "asc" }],
  });
}
